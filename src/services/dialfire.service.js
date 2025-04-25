const axios = require('axios');

class DialfireService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.DIALFIRE_API_URL,
      headers: {
        'Authorization': `Bearer ${process.env.DIALFIRE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async fetchNewPDFs() {
    try {
      const response = await this.client.get('/documents/new');
      return response.data;
    } catch (error) {
      console.error('Error fetching PDFs from Dialfire:', error);
      throw error;
    }
  }

  async downloadPDF(documentId) {
    try {
      const response = await this.client.get(`/documents/${documentId}/download`, {
        responseType: 'arraybuffer'
      });
      return {
        buffer: response.data,
        filename: `${documentId}.pdf`
      };
    } catch (error) {
      console.error(`Error downloading PDF ${documentId}:`, error);
      throw error;
    }
  }

  async extractPLZFromPDF(pdfBuffer) {
    // TODO: Implement PDF parsing logic to extract PLZ
    // This would depend on the PDF structure from Dialfire
    try {
      // Example implementation - replace with actual PDF parsing
      return {
        plz: '12345', // This should be extracted from the PDF
        metadata: {}
      };
    } catch (error) {
      console.error('Error extracting PLZ from PDF:', error);
      throw error;
    }
  }

  async markProcessed(documentId) {
    try {
      await this.client.post(`/documents/${documentId}/mark-processed`);
    } catch (error) {
      console.error(`Error marking document ${documentId} as processed:`, error);
      throw error;
    }
  }
}

module.exports = new DialfireService();
