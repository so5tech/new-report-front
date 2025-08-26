import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';
console.log(API_BASE_URL, "api based---<<<")

const testSchema = yup.object().shape({
  testName: yup.string().required('Test name is required'),
  observedValue: yup.string().required('Observed value is required'),
  unit: yup.string().required('Unit is required'),
  referenceRange: yup.string().required('Reference range is required'),
});

interface Test {
  testName: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
  isNormal: boolean;
}

interface TestInputScreenProps {
  route: any;
}

const TestInputScreen: React.FC<TestInputScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { patientData } = route.params;
  const [tests, setTests] = useState<Test[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [testSelectionModalVisible, setTestSelectionModalVisible] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      console.log("Fetching tests from:", `${API_BASE_URL}/tests`);
      const response = await axios.get(`${API_BASE_URL}/tests`);
      console.log("Tests fetched:", response.data.data.length, "tests");
      setAvailableTests(response.data.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
      Alert.alert(
        'Connection Error', 
        'Could not connect to the server. Please ensure the backend is running.'
      );
    }
  };

  const handleAddTest = (values: Test) => {
    const newTest = {
      ...values,
      isNormal: checkIfNormal(values.observedValue, values.referenceRange),
    };
    setTests([...tests, newTest]);
    setModalVisible(false);
    setSelectedTest(null);
  };

  const checkIfNormal = (value: string, range: string): boolean => {
    // Simple normal range checking - can be enhanced
    return true; // Placeholder
  };

  const handleRemoveTest = (index: number) => {
    Alert.alert(
      'Remove Test',
      'Are you sure you want to remove this test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newTests = tests.filter((_, i) => i !== index);
            setTests(newTests);
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (tests.length === 0) {
      Alert.alert('No Tests', 'Please add at least one test before submitting.');
      return;
    }

    try {
      const reportData = {
        ...patientData,
        age: parseInt(patientData.age),
        testResults: tests,
      };

      const response = await axios.post(`${API_BASE_URL}/patients`, reportData);
      // console.log(response, "data,,,,<<<<<")
      Alert.alert(
        'Success',
        'Report submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ReportDetails', { report: response.data.data });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleTestSelect = (test: any) => {
    setSelectedTest(test);
  };

  const TestSelectionModal = React.memo(() => {
    const filteredTests = useMemo(() => 
      availableTests.filter(test =>
        test.testName.toLowerCase().includes(searchQuery.toLowerCase())
      ), [availableTests, searchQuery]);

    const renderTestItem = React.useCallback(({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.testItem}
        onPress={() => {
          setSelectedTest(item);
          setTestSelectionModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View>
          <Text style={styles.testName}>{item.testName}</Text>
          <Text style={styles.testRange}>
            Unit: {item.unit} | Range: {item.referenceValue}
          </Text>
        </View>
      </TouchableOpacity>
    ), [setSelectedTest, setTestSelectionModalVisible, setSearchQuery]);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={testSelectionModalVisible}
        onRequestClose={() => {
          setTestSelectionModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Select Test from Library</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search tests..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {filteredTests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No tests found' : 'No test templates available'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Please ensure MongoDB is running and test data is seeded'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredTests}
                keyExtractor={(item) => item._id}
                renderItem={renderTestItem}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={10}
              />
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { marginTop: 10 }]}
              onPress={() => {
                setTestSelectionModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  });

  const TestModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Test Result</Text>
          
          <Formik
            initialValues={{
              testName: selectedTest?.testName || '',
              observedValue: '',
              unit: selectedTest?.unit || '',
              referenceRange: selectedTest?.referenceValue || '',
            }}
            validationSchema={testSchema}
            onSubmit={handleAddTest}
            enableReinitialize={true}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => (
              <View>
                <TouchableOpacity
                  style={styles.testSelector}
                  onPress={() => setTestSelectionModalVisible(true)}
                >
                  <Text style={styles.testSelectorText}>
                    {selectedTest ? selectedTest.testName : 'Select from library'}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, touched.testName && errors.testName && styles.errorInput]}
                  placeholder="Test name"
                  value={values.testName}
                  onChangeText={handleChange('testName')}
                  onBlur={handleBlur('testName')}
                />
                {touched.testName && errors.testName && (
                  <Text style={styles.errorText}>{errors.testName}</Text>
                )}

                <TextInput
                  style={[styles.input, touched.observedValue && errors.observedValue && styles.errorInput]}
                  placeholder="Observed value"
                  value={values.observedValue}
                  onChangeText={handleChange('observedValue')}
                  onBlur={handleBlur('observedValue')}
                />
                {touched.observedValue && errors.observedValue && (
                  <Text style={styles.errorText}>{errors.observedValue}</Text>
                )}

                <TextInput
                  style={[styles.input, touched.unit && errors.unit && styles.errorInput]}
                  placeholder="Unit"
                  value={values.unit}
                  onChangeText={handleChange('unit')}
                  onBlur={handleBlur('unit')}
                  editable={!selectedTest}
                />
                {touched.unit && errors.unit && (
                  <Text style={styles.errorText}>{errors.unit}</Text>
                )}

                <TextInput
                  style={[styles.input, touched.referenceRange && errors.referenceRange && styles.errorInput]}
                  placeholder="Reference range"
                  value={values.referenceRange}
                  onChangeText={handleChange('referenceRange')}
                  onBlur={handleBlur('referenceRange')}
                  editable={!selectedTest}
                />
                {touched.referenceRange && errors.referenceRange && (
                  <Text style={styles.errorText}>{errors.referenceRange}</Text>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedTest(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={() => handleSubmit()}
                  >
                    <Text style={styles.buttonText}>Add Test</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Test Results</Text>
          <Text style={styles.subtitle}>Add test results for {patientData.patientName}</Text>
        </View>

        <View style={styles.testList}>
          <View style={styles.testHeader}>
            <Text style={styles.testCount}>Tests Added: {tests.length}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Test</Text>
            </TouchableOpacity>
          </View>

          {tests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tests added yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Test" to get started</Text>
            </View>
          ) : (
            <FlatList
              data={tests}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testName}>{item.testName}</Text>
                    <Text style={styles.testValue}>
                      {item.observedValue} {item.unit}
                    </Text>
                    <Text style={styles.testRange}>
                      Reference: {item.referenceRange}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveTest(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, tests.length === 0 && styles.disabledButton]}
          onPress={handleSubmitReport}
          disabled={tests.length === 0}
        >
          <Text style={styles.submitButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      <TestModal />
      <TestSelectionModal />
    </View>
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
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  testList: {
    padding: 20,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  testCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  testValue: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 2,
  },
  testRange: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#e74c3c',
    fontSize: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  testSelector: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  testSelectorText: {
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TestInputScreen;