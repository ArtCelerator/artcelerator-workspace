import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { formatIDR, formatDateShort } from '@/lib/utils';

// You can register fonts here if needed
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#27272a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#e4e4e7', paddingBottom: 20 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: 'bold' },
  agencyInfo: { color: '#71717a', marginTop: 5 },
  invoiceTitle: { fontSize: 32, fontWeight: 'bold', color: '#18181b', textAlign: 'right' },
  invoiceNo: { fontSize: 12, color: '#71717a', textAlign: 'right', marginTop: 5 },
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  billTo: { width: '50%' },
  infoGroup: { marginBottom: 10 },
  label: { color: '#71717a', fontSize: 9, textTransform: 'uppercase', marginBottom: 2 },
  valueBold: { fontSize: 11, fontWeight: 'bold' },
  table: { width: '100%', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f4f4f5', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f4f4f5', padding: 8 },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  summary: { width: '40%', alignSelf: 'flex-end' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 2, borderTopColor: '#18181b', marginTop: 4 },
  grandTotalText: { fontSize: 14, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#71717a', borderTopWidth: 1, borderTopColor: '#e4e4e7', paddingTop: 20 },
});

export function InvoicePDF({ invoice }: { invoice: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ArtCelerator</Text>
            </View>
            <Text style={styles.agencyInfo}>Jakarta, Indonesia</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNo}>{invoice.invoiceNo}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.billTo}>
            <View style={styles.infoGroup}>
              <Text style={styles.label}>Bill To:</Text>
              <Text style={styles.valueBold}>{invoice.client.name}</Text>
              {invoice.client.industry && <Text style={{ color: '#71717a', marginTop: 2 }}>{invoice.client.industry}</Text>}
            </View>
            <View style={styles.infoGroup}>
              <Text style={styles.label}>Project:</Text>
              <Text>{invoice.title}</Text>
            </View>
          </View>
          <View style={{ width: '40%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={styles.label}>Issue Date:</Text>
                <Text style={styles.valueBold}>{formatDateShort(invoice.issueDate)}</Text>
              </View>
              <View>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.valueBold}>{formatDateShort(invoice.dueDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.items.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatIDR(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatIDR(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{formatIDR(invoice.subtotal)}</Text>
          </View>
          {invoice.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text>Tax</Text>
              <Text>{formatIDR(invoice.tax)}</Text>
            </View>
          )}
          {invoice.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Discount</Text>
              <Text>-{formatIDR(invoice.discount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>Total</Text>
            <Text style={styles.grandTotalText}>{formatIDR(invoice.total)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {invoice.notes && <Text style={{ marginBottom: 10 }}>Notes: {invoice.notes}</Text>}
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}
