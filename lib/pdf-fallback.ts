// Simple PDF generation fallback
export async function generatePdfFallback(html: string, filename: string): Promise<Buffer> {
  try {
    // Try to use html-pdf-node as fallback if available
    // @ts-ignore
    const pdf = await import('html-pdf-node').catch(() => null)
    
    if (!pdf) {
      throw new Error('html-pdf-node not available')
    }
    
    const options = {
      format: 'A4',
      border: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    }
    
    const file = { content: html }
    const pdfBuffer = await pdf.generatePdf(file, options)
    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('PDF fallback failed:', error)
    throw new Error('PDF generation not available')
  }
}