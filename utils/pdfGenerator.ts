import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import { db } from '@/db/client';
import { companySettings } from '@/db/schema';

interface PDFParams {
  doc: any;
  client: any;
  items: any[];
  materials: any[];
  docType: 'quote' | 'invoice';
  /** Optional action: 'share' will trigger default share, 'none' returns path */
  action?: 'share' | 'none';
}

export async function generateAndSharePDF(params: PDFParams) {
  const { doc, client, items, materials, docType } = params;
  const action = params.action || 'share';
  // Load company settings
  let company = { companyName: 'AD Services', siret: '', address: '', email: '', phone: '', website: '', logoBase64: '' };
  try {
    const rows = await db.select().from(companySettings);
    if (rows.length > 0) {
      company = {
        companyName: rows[0].companyName || 'AD Services',
        siret: rows[0].siret || '',
        address: rows[0].address || '',
        email: rows[0].email || '',
        phone: rows[0].phone || '',
        website: rows[0].website || '',
        logoBase64: rows[0].logoBase64 || '',
      };
    }
  } catch {}

  // If no logo is set, use the default app logo
  let finalLogoBase64 = company.logoBase64;
  if (!finalLogoBase64) {
    try {
      const logoAsset = Asset.fromModule(require('@/assets/logo-app.png'));
      await logoAsset.downloadAsync();
      if (logoAsset.localUri) {
        const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri, { encoding: FileSystem.EncodingType.Base64 });
        finalLogoBase64 = `data:image/png;base64,${base64}`;
      }
    } catch (e) {
      console.log('Could not load default logo for PDF', e);
    }
  }

  const docNumber = docType === 'quote' ? doc.quoteNumber : doc.invoiceNumber;
  const docLabel = docType === 'quote' ? 'DEVIS' : 'FACTURE';
  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '';

  const prestationsSubtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
  const materialsSubtotal = materials.reduce((s: number, m: any) => s + (m.price ?? 0), 0);
  const discount = doc.discount ?? 0;
  const total = doc.total ?? 0;

  const itemsRows = items.map((i: any) => `
    <tr>
      <td>${i.title ?? ''}</td>
      <td style="color:#64748B">${i.description ?? ''}</td>
      <td style="text-align:right">${Math.round(i.quantity ?? 0)}</td>
      <td style="text-align:right">${(i.unitPrice ?? 0).toFixed(2)} €</td>
      <td style="text-align:right;font-weight:700">${(i.total ?? 0).toFixed(2)} €</td>
    </tr>
  `).join('');

  const materialsRows = materials.map((m: any) => `
    <tr>
      <td>${m.name ?? ''}</td>
      <td style="text-align:right;font-weight:700">${(m.price ?? 0).toFixed(2)} €</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#1E1E1A; font-size:13px; padding:40px; }
    .header { display:flex; justify-content:space-between; margin-bottom:40px; }
    .company { max-width:50%; }
    .company img { max-width: 300px; max-height: 150px; margin-bottom: 15px; object-fit: contain; }
    .company h1 { font-size:22px; color:#2F7AA9; margin-bottom:6px; }
    .company p { color:#64748B; line-height:1.6; font-size:12px; }
    .doc-info { text-align:right; }
    .doc-info .doc-label { font-size:28px; font-weight:800; color:#2F7AA9; letter-spacing:2px; }
    .doc-info p { color:#64748B; font-size:12px; margin-top:4px; }
    .client-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:30px; }
    .client-box h3 { font-size:11px; color:#64748B; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    .client-box p { font-size:14px; font-weight:600; }
    .client-box .meta { color:#64748B; font-size:12px; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    th { background:#F1F5F9; color:#475569; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding:10px 12px; text-align:left; }
    td { padding:10px 12px; border-bottom:1px solid #E2E8F0; font-size:13px; }
    .section-title { font-size:14px; font-weight:700; color:#1E1E1A; margin-bottom:10px; margin-top:10px; }
    .totals { margin-top:20px; margin-left:auto; width:280px; }
    .totals .row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
    .totals .row.grand { border-top:2px solid #1E1E1A; padding-top:10px; margin-top:6px; }
    .totals .row.grand .label { font-size:16px; font-weight:800; }
    .totals .row.grand .value { font-size:18px; font-weight:800; color:#2F7AA9; }
    .totals .row .discount { color:#A1262A; }
    .notes { margin-top:30px; padding:14px; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0; }
    .notes h4 { font-size:11px; color:#64748B; text-transform:uppercase; margin-bottom:6px; }
    .notes p { font-size:12px; color:#475569; line-height:1.6; }
    .footer { margin-top:40px; text-align:center; font-size:10px; color:#94A3B8; border-top:1px solid #E2E8F0; padding-top:16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      ${finalLogoBase64 ? `
      <img src="${finalLogoBase64}" />
      ` : ''}
      <h1>${company.companyName}</h1>
      ${company.address ? `<p>${company.address}</p>` : ''}
      ${company.phone ? `<p>Tél: ${company.phone}</p>` : ''}
      ${company.email ? `<p>${company.email}</p>` : ''}
      ${company.siret ? `<p>SIRET: ${company.siret}</p>` : ''}
    </div>
    <div class="doc-info">
      <div class="doc-label">${docLabel}</div>
      <p><strong>N°</strong> ${docNumber}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Statut:</strong> ${doc.status ?? 'Brouillon'}</p>
    </div>
  </div>

  <div class="client-box">
    <h3>Destinataire</h3>
    <p>${client?.name ?? 'Client inconnu'}</p>
    ${client?.address ? `<p class="meta">${client.address}</p>` : ''}
    ${client?.phone ? `<p class="meta">Tél: ${client.phone}</p>` : ''}
    ${client?.email ? `<p class="meta">${client.email}</p>` : ''}
  </div>

  ${items.length > 0 ? `
    <div class="section-title">Prestations</div>
    <table>
      <thead><tr><th>Titre</th><th>Description</th><th style="text-align:right">Qté</th><th style="text-align:right">P.U.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
  ` : ''}

  ${materials.length > 0 ? `
    <div class="section-title">Matériels & Fournitures</div>
    <table>
      <thead><tr><th>Désignation</th><th style="text-align:right">Prix</th></tr></thead>
      <tbody>${materialsRows}</tbody>
    </table>
  ` : ''}

  <div class="totals">
    <div class="row"><span>Prestations</span><span>${prestationsSubtotal.toFixed(2)} €</span></div>
    <div class="row"><span>Matériels</span><span>${materialsSubtotal.toFixed(2)} €</span></div>
    ${discount > 0 ? `<div class="row"><span class="discount">Remise</span><span class="discount">-${discount.toFixed(2)} €</span></div>` : ''}
    <div class="row grand"><span class="label">TOTAL NET</span><span class="value">${total.toFixed(2)} €</span></div>
  </div>

  ${doc.notes ? `<div class="notes"><h4>Notes</h4><p>${doc.notes}</p></div>` : ''}

  <div class="footer">
    ${company.companyName}${company.siret ? ` — SIRET: ${company.siret}` : ''}${company.address ? ` — ${company.address}` : ''}
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    
    // Rename file professionally
    const safeClientName = client?.name ? client.name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') : 'Client';
    const cleanDocNum = docNumber.replace(/[^a-z0-9]/gi, '_');
    const newPath = `${FileSystem.cacheDirectory}${docLabel}_${cleanDocNum}_${safeClientName}.pdf`;
    
    await FileSystem.moveAsync({ from: uri, to: newPath });
    
    // Default share behavior if requested
    if (action === 'share') {
      await Sharing.shareAsync(newPath, { mimeType: 'application/pdf', dialogTitle: `${docLabel} ${docNumber}` });
    }
    
    // Return the path so caller can decide how to share (Email, WhatsApp, etc.)
    return newPath;
  } catch (e) {
    console.error('PDF generation error:', e);
    return null;
  }
}

// Helper to send the generated PDF via email
export async function emailPdf(pdfPath: string, recipient: string, subject: string, body: string) {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Email is not available on this device');
      await Sharing.shareAsync(pdfPath); // Fallback to generic share
      return;
    }
    await MailComposer.composeAsync({
      recipients: recipient ? [recipient] : [],
      subject,
      body,
      attachments: [pdfPath],
    });
  } catch (e) {
    console.error('Email compose error:', e);
  }
}

// Helper to share the PDF via WhatsApp (opens native share dialog specifically)
export async function sharePdfViaWhatsApp(pdfPath: string) {
  try {
    await Sharing.shareAsync(pdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Partager via WhatsApp',
    });
  } catch (e) {
    console.error('WhatsApp share error:', e);
  }
}


