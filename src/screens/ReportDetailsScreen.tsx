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
// import * as FileSystem from 'expo-file-system';
import { IMAGES } from '../../assets';


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
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1; }

            /* Header */
            // .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1px; margin-bottom: 10px; height: 180px; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #333;
              padding: 10px 20px;
              margin-bottom: 20px;
            }
            .header-left img {
              height: 60px; /* adjust as needed */
            }
            .header-center {
              text-align: center;
              flex: 1;
            }
            .header-center h1 {
              margin: 0;
              color: #2c3e50;
            }
            .header-center p {
              margin: 2px 0;
              color: #2c3e50;
            }
            .header-right p {
              margin: 0;
              line-height: 1.1;
            }
            /* Patient info */
            .patient-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .patient-info h2 { margin-top: 0; color: #2c3e50; }
            .info-row { display: flex; justify-content: space-between; }
            .info-row .left, .info-row .right { display: flex; flex-direction: column; }
            .info-row .left p, .info-row .right p { margin: 5px 0; }

            /* Table */
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .compact-row td {
                padding-top: 0px !important;
                padding-bottom: 0px !important;
              }
            .abnormal { color: #dc3545; font-weight: bold; }
            .normal { color: #28a745; }

            /* Footer */
            .footer { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>

          <!-- header -->
          <div class="header">
            <div class="header-left">
              <img src="data:image/jpeg;base64,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" alt="Lab Logo1" />
            </div>
            <div class="header-center">
            <h1>S. K. Diagnostics</h1>  
            <h1>PATHOLOGY</h1>
            <p class="name">Dr. M.L. Agrawal, Dispensory, Banki Mongra, Korba</p>
            </div>
            <div class="header-right">
              <p class="regno"> Mob: 9907142225</p>
              <p class="name"> Nandesh Singh</p>
              <p class="extra"> B.Sc. DMLT (Pathology)</p>
            </div>
          </div>

          <!-- Patient info -->
          <div class="patient-info">
            <div class="info-row">
              <div class="left">
                <p><strong>Patient Name:</strong> ${report.patientName}</p>
                <p><strong>Age:</strong> ${report.age}</p>
                <p><strong>Doctor:</strong> Dr. ${report.doctorName}</p>
              </div>
              <div class="right">
                <p><strong>Gender:</strong> ${report.gender}</p>
                <p><strong>Report Date:</strong> ${formatDate(report.date)}</p>
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Observed Value</th>
        <th>Unit</th>
        <th>Reference Range</th>
      </tr>
    </thead>

    <tbody>
      ${report.testResults.map(test => {
        // If multi-input test, return multiple rows
        if (test.multiInput && Array.isArray(test.parameters)) {
          return test.parameters.map((p, idx) => `
            <tr>
              <td>${idx === 0 ? test.testName : ""}</td>
            </tr>
            <tr class="compact-row">
              <td>${"&nbsp;&nbsp;&nbsp;&nbsp;" + p.parameterName || ""}</td>
              <td>${p.observedValue || ""}</td>
              <td>${p.unit || ""}</td>
              <td>${p.referenceRange || ""}</td>
            </tr>
          `).join('');
        }

        // Otherwise return normal single-input row
        return `
          <tr>
            <td>${test.testName}</td>
            <td>${test.observedValue || ""}</td>
            <td>${test.unit || ""}</td>
            <td>${test.referenceRange || ""}</td>
          </tr>
                `;
        }).join('')}
            </tbody>
          </table>
        </div>


          <!-- Footer -->
          <div class="footer">
            
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