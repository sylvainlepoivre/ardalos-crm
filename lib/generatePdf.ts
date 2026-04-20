// lib/generatePdf.ts
// ============================================================================
// Convertit plusieurs docx en PDF via CloudConvert, puis fusionne en un
// seul PDF, renvoie le Buffer final.
//
// Utilise l'API CloudConvert v2 (https://cloudconvert.com/api/v2).
// Authentification par Bearer token stocke dans CLOUDCONVERT_API_KEY.
//
// Workflow :
//   1. Creer un "job" avec N "tasks" :
//      - N import tasks (upload chaque docx)
//      - N convert tasks (chaque docx -> pdf)
//      - 1 merge task (fusionne tous les pdf)
//      - 1 export task (donne l'URL de download)
//   2. Uploader les fichiers via les upload URLs renvoyees
//   3. Attendre que le job termine (polling de l'endpoint /jobs/{id})
//   4. Recuperer le PDF final et le renvoyer
// ============================================================================

const CLOUDCONVERT_API_URL = 'https://api.cloudconvert.com/v2'

type DocxInput = {
  filename: string
  buffer: Buffer
}

export async function convertDocxsToSinglePdf(
  docxs: DocxInput[],
  outputFilename: string = 'dossier.pdf',
): Promise<Buffer> {
  const apiKey = process.env.CLOUDCONVERT_API_KEY
  if (!apiKey) throw new Error('CLOUDCONVERT_API_KEY manquante')
  if (!docxs || docxs.length === 0) throw new Error('Aucun docx a convertir')

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  // ==========================================================================
  // 1. Creer le job : N imports + N convertions + 1 merge + 1 export
  // ==========================================================================
  const tasks: Record<string, any> = {}
  const importTaskNames: string[] = []
  const convertTaskNames: string[] = []

  docxs.forEach((_, idx) => {
    const importName = `import-${idx}`
    const convertName = `convert-${idx}`
    importTaskNames.push(importName)
    convertTaskNames.push(convertName)

    tasks[importName] = {
      operation: 'import/upload',
    }
    tasks[convertName] = {
      operation: 'convert',
      input: importName,
      output_format: 'pdf',
      engine: 'libreoffice',
    }
  })

  tasks['merge'] = {
    operation: 'merge',
    input: convertTaskNames,
    output_format: 'pdf',
    filename: outputFilename,
  }
  tasks['export'] = {
    operation: 'export/url',
    input: 'merge',
    inline: false,
    archive_multiple_files: false,
  }

  const jobPayload = { tasks }

  const jobRes = await fetch(`${CLOUDCONVERT_API_URL}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(jobPayload),
  })
  if (!jobRes.ok) {
    const txt = await jobRes.text()
    throw new Error(`CloudConvert job creation failed: ${jobRes.status} ${txt}`)
  }
  const jobData = await jobRes.json()
  const jobId: string = jobData?.data?.id
  const jobTasks: any[] = jobData?.data?.tasks || []
  if (!jobId) throw new Error('Job ID manquant dans la reponse CloudConvert')

  // ==========================================================================
  // 2. Uploader les fichiers docx via les upload URLs
  // ==========================================================================
  for (let i = 0; i < docxs.length; i++) {
    const importTaskName = importTaskNames[i]
    const task = jobTasks.find(t => t.name === importTaskName)
    if (!task) throw new Error(`Task ${importTaskName} introuvable dans le job`)
    const uploadForm = task?.result?.form
    if (!uploadForm?.url) throw new Error(`URL d'upload manquante pour ${importTaskName}`)

    const form = new FormData()
    // Les parametres fournis par CloudConvert doivent etre ajoutes en premier
    const params = uploadForm.parameters || {}
    for (const key of Object.keys(params)) {
      form.append(key, params[key])
    }
    // Le fichier DOIT etre le dernier champ (requis par S3)
    const blob = new Blob([new Uint8Array(docxs[i].buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    form.append('file', blob, docxs[i].filename)

    const uploadRes = await fetch(uploadForm.url, { method: 'POST', body: form })
    if (!uploadRes.ok && uploadRes.status !== 201 && uploadRes.status !== 204) {
      const txt = await uploadRes.text()
      throw new Error(`Upload echoue pour ${docxs[i].filename}: ${uploadRes.status} ${txt.substring(0, 200)}`)
    }
  }

  // ==========================================================================
  // 3. Attendre que le job termine (polling)
  // ==========================================================================
  const maxWaitMs = 120000 // 2 minutes max
  const pollIntervalMs = 2000
  const start = Date.now()
  let exportedUrl: string | null = null

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, pollIntervalMs))
    const pollRes = await fetch(`${CLOUDCONVERT_API_URL}/jobs/${jobId}`, { headers })
    if (!pollRes.ok) {
      const txt = await pollRes.text()
      throw new Error(`Polling echoue: ${pollRes.status} ${txt}`)
    }
    const pollData = await pollRes.json()
    const status = pollData?.data?.status
    if (status === 'error') {
      const failedTasks = (pollData?.data?.tasks || []).filter((t: any) => t.status === 'error')
      const errMsg = failedTasks.map((t: any) => `${t.name}: ${t.message || 'erreur inconnue'}`).join(' | ')
      throw new Error(`Job CloudConvert en erreur: ${errMsg || 'erreur inconnue'}`)
    }
    if (status === 'finished') {
      const exportTask = (pollData?.data?.tasks || []).find((t: any) => t.name === 'export')
      const files = exportTask?.result?.files || []
      if (files.length === 0) throw new Error('Pas de fichier exporte par CloudConvert')
      exportedUrl = files[0].url
      break
    }
  }

  if (!exportedUrl) throw new Error('Timeout : CloudConvert a mis plus de 2 minutes')

  // ==========================================================================
  // 4. Telecharger le PDF final
  // ==========================================================================
  const finalRes = await fetch(exportedUrl)
  if (!finalRes.ok) throw new Error(`Telechargement PDF echoue: ${finalRes.status}`)
  const arrayBuffer = await finalRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
