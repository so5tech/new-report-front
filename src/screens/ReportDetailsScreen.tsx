import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


interface Report {
  _id: string;
  patientName: string;
  age: number;
  gender: string;
  patientId: string;
  doctorName: string;
  date: string;
  testResults: Array<{
    testName: string;
    observedValue: string;
    unit: string;
    referenceRange: string;
    isNormal: boolean;
  }>;
  pdfPath: string;
}

interface ReportDetailsScreenProps {
  route: any;
}

const ReportDetailsScreen: React.FC<ReportDetailsScreenProps> = ({ route }) => {
  const { report } = route.params;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generateHTML = () => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #2c3e50; }
            .patient-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .patient-info h2 { margin-top: 0; color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .abnormal { color: #dc3545; font-weight: bold; }
            .normal { color: #28a745; }
            .footer { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PATHOLOGY REPORT</h1>
            <p><strong>MediCare Diagnostic Center</strong></p>
            <p>123 Medical Street, Healthcare City</p>
            <p>Phone: (555) 123-4567 | Email: reports@medicare.com</p>
          </div>

          <div class="patient-info">
            <h2>Patient Information</h2>
            <p><strong>Patient Name:</strong> ${report.patientName}</p>
            <p><strong>Patient ID:</strong> ${report.patientId}</p>
            <p><strong>Age:</strong> ${report.age}</p>
            <p><strong>Gender:</strong> ${report.gender}</p>
            <p><strong>Doctor:</strong> Dr. ${report.doctorName}</p>
            <p><strong>Report Date:</strong> ${formatDate(report.date)}</p>
          </div>

          <div>
            <h2>Test Results</h2>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Observed Value</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${report.testResults.map(test => `
                  <tr>
                    <td>${test.testName}</td>
                    <td>${test.observedValue}</td>
                    <td>${test.unit}</td>
                    <td>${test.referenceRange}</td>
                    <td class="${test.isNormal ? 'normal' : 'abnormal'}">
                      ${test.isNormal ? 'Normal' : 'Abnormal'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><em>This report is generated electronically and is valid without signature.</em></p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          'PDF Generated',
          'Report saved successfully!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleSharePDF = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Pathology Report',
        });
      } else {
        Alert.alert('Sharing not available', 'PDF sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF');
    }
  };

  const handleViewPDF = async () => {
    try {
      const html = generateHTML();
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error viewing PDF:', error);
      Alert.alert('Error', 'Failed to view PDF');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Details</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Patient Name:</Text>
            <Text style={styles.value}>{report.patientName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Patient ID:</Text>
            <Text style={styles.value}>{report.patientId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{report.age}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{report.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>Dr. {report.doctorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Report Date:</Text>
            <Text style={styles.value}>{formatDate(report.date)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results ({report.testResults.length})</Text>
        {report.testResults.map((test, index) => (
          <View key={index} style={styles.testCard}>
            <Text style={styles.testName}>{test.testName}</Text>
            <View style={styles.testDetails}>
              <Text style={styles.testValue}>
                <Text style={styles.bold}>Observed:</Text> {test.observedValue} {test.unit}
              </Text>
              <Text style={styles.testRange}>
                <Text style={styles.bold}>Reference:</Text> {test.referenceRange}
              </Text>
              <Text style={[styles.status, test.isNormal ? styles.normal : styles.abnormal]}>
                {test.isNormal ? '✓ Normal' : '⚠ Abnormal'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={handleViewPDF}>
          <Text style={styles.actionButtonText}>View PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.downloadButton]} onPress={handleDownloadPDF}>
          <Text style={styles.actionButtonText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleSharePDF}>
          <Text style={styles.actionButtonText}>Share PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  value: {
    color: '#7f8c8d',
  },
  testCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  testDetails: {
    marginTop: 5,
  },
  testValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  testRange: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  normal: {
    color: '#27ae60',
  },
  abnormal: {
    color: '#e74c3c',
  },
  actions: {
    padding: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#3498db',
  },
  downloadButton: {
    backgroundColor: '#27ae60',
  },
  shareButton: {
    backgroundColor: '#f39c12',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportDetailsScreen;