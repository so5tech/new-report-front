// TestInputScreen.tsx
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';

const testSchema = yup.object().shape({
  testName: yup.string().required('Test name is required'),
  observedValue: yup.string().required('Observed value is required'),
  unit: yup.string().required('Unit is required'),
  referenceRange: yup.string().required('Reference range is required'),
});

interface SingleTestResult {
  testName: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
  isNormal?: boolean;
}

interface MultiParam {
  parameterName: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
}

interface MultiTestResult {
  testName: string;
  multiInput: true;
  parameters: MultiParam[];
}

type TestResult = SingleTestResult | MultiTestResult;

interface TestInputScreenProps {
  route: any;
}

const TestInputScreen: React.FC<TestInputScreenProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { patientData } = route.params;
  const [tests, setTests] = useState<TestResult[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [testSelectionModalVisible, setTestSelectionModalVisible] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-input state
  const [multiInputValues, setMultiInputValues] = useState<MultiParam[]>([]);
  const [currentParamIndex, setCurrentParamIndex] = useState(0);

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      console.log("Fetching tests from:", `${API_BASE_URL}/tests`);
      const response = await axios.get(`${API_BASE_URL}/tests`);
      // expecting response.data.data to be array
      const data = response?.data?.data ?? [];
      console.log("Tests fetched:", data.length, "tests");
      setAvailableTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to the server. Please ensure the backend is running.'
      );
    }
  };

  const checkIfNormal = (value: string, range: string): boolean => {
    // Placeholder: you can enhance range parsing here.
    return true;
  };

  const handleAddTest = (values: SingleTestResult) => {
    const newTest: SingleTestResult = {
      ...values,
      isNormal: checkIfNormal(values.observedValue, values.referenceRange),
    };
    setTests(prev => [...prev, newTest]);
    setModalVisible(false);
    setSelectedTest(null);
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
      setIsSubmitting(true);

      const reportData = {
        ...patientData,
        age: patientData.age ? parseInt(patientData.age, 10) : patientData.age,
        testResults: tests,
      };

      const response = await axios.post(`${API_BASE_URL}/patients`, reportData);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSelect = (test: any) => {
    setSelectedTest(test);

    if (test?.multiInput) {
      const init = (test.input || []).map((p: any) => ({
        parameterName: p.parameterName || p.name || 'Param',
        observedValue: '',
        unit: p.unit || '',
        referenceRange: p.referenceValue || p.referenceRange || '',
      }));
      setMultiInputValues(init);
      setCurrentParamIndex(0);
    } else {
      setMultiInputValues([]);
      setCurrentParamIndex(0);
    }
  };

  const addMultiTestToList = () => {
    // Validate all parameters have observedValue
    const missing = multiInputValues.findIndex(p => !p.observedValue || p.observedValue.trim() === '');
    if (missing !== -1) {
      Alert.alert('Missing value', `Please enter value for ${multiInputValues[missing].parameterName}`);
      setCurrentParamIndex(missing);
      return;
    }

    const result: MultiTestResult = {
      testName: selectedTest.testName,
      multiInput: true,
      parameters: multiInputValues.map(p => ({
        parameterName: p.parameterName,
        observedValue: p.observedValue,
        unit: p.unit,
        referenceRange: p.referenceRange,
      })),
    };

    setTests(prev => [...prev, result]);
    setModalVisible(false);
    setSelectedTest(null);
    setMultiInputValues([]);
    setCurrentParamIndex(0);
  };

  const TestSelectionModal = React.memo(() => {
    const filteredTests = useMemo(() =>
      availableTests.filter(test =>
        (test.testName || '').toLowerCase().includes(searchQuery.toLowerCase())
      ), [availableTests, searchQuery]);

    const renderTestItem = React.useCallback(({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.testItem}
        onPress={() => {
          setSelectedTest(item);
          setTestSelectionModalVisible(false);
          setSearchQuery('');
          // prepare multi state if required
          handleTestSelect(item);
          // open add modal immediately
          setModalVisible(true);
        }}
      >
        <View>
          <Text style={styles.testName}>{item.testName}</Text>
          <Text style={styles.testRange}>
            Unit: {item.unit || (item.input && item.input[0]?.unit) || '—'} | Range: {item.referenceValue || (item.input && item.input[0]?.referenceValue) || '—'}
          </Text>
        </View>
      </TouchableOpacity>
    ), []);

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
                keyExtractor={(item) => (item._id?.$oid || item._id || item._id?.toString() || Math.random().toString())}
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

  const TestModal = () => {
    const isMulti = !!selectedTest?.multiInput;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedTest(null);
          setMultiInputValues([]);
          setCurrentParamIndex(0);
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>
              {selectedTest?.testName || 'Add Test Result'}
            </Text>

            {isMulti ? (
              <>
                <View style={styles.multiHeader}>
                  <TouchableOpacity
                    disabled={currentParamIndex === 0}
                    onPress={() => setCurrentParamIndex(prev => Math.max(0, prev - 1))}
                    style={[styles.navArrow, currentParamIndex === 0 && styles.disabledArrow]}
                  >
                    <Text style={[styles.arrowText, currentParamIndex === 0 && styles.disabledArrowText]}>◀</Text>
                  </TouchableOpacity>

                  <View style={styles.paramTitleWrap}>
                    <Text style={styles.paramTitle}>
                      {multiInputValues[currentParamIndex]?.parameterName || `Parameter ${currentParamIndex + 1}`}
                    </Text>
                    <Text style={styles.paramSubtitle}>
                      {currentParamIndex + 1} / {multiInputValues.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={currentParamIndex === multiInputValues.length - 1}
                    onPress={() => setCurrentParamIndex(prev => Math.min(multiInputValues.length - 1, prev + 1))}
                    style={[styles.navArrow, currentParamIndex === multiInputValues.length - 1 && styles.disabledArrow]}
                  >
                    <Text style={[styles.arrowText, currentParamIndex === multiInputValues.length - 1 && styles.disabledArrowText]}>▶</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Parameter</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#f0f3f5' }]}
                    value={multiInputValues[currentParamIndex]?.parameterName || ''}
                    editable={false}
                  />

                  <Text style={styles.label}>Observed Value *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter observed value"
                    value={multiInputValues[currentParamIndex]?.observedValue}
                    onChangeText={(txt) => {
                      const arr = [...multiInputValues];
                      arr[currentParamIndex] = { ...arr[currentParamIndex], observedValue: txt };
                      setMultiInputValues(arr);
                    }}
                    keyboardType="default"
                  />

                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#f0f3f5' }]}
                    value={multiInputValues[currentParamIndex]?.unit || ''}
                    editable={false}
                  />

                  <Text style={styles.label}>Reference Range</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#f0f3f5' }]}
                    value={multiInputValues[currentParamIndex]?.referenceRange || ''}
                    editable={false}
                  />
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setSelectedTest(null);
                      setModalVisible(false);
                      setMultiInputValues([]);
                      setCurrentParamIndex(0);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={() => addMultiTestToList()}
                  >
                    <Text style={styles.buttonText}>Add Test</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Formik
                initialValues={{
                  testName: selectedTest?.testName || '',
                  observedValue: '',
                  unit: selectedTest?.unit || '',
                  referenceRange: selectedTest?.referenceValue || '',
                }}
                validationSchema={testSchema}
                onSubmit={(vals) => handleAddTest(vals as SingleTestResult)}
                enableReinitialize={true}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <>
                    <Text style={styles.label}>Observed Value</Text>
                    <TextInput
                      style={[styles.input, touched.observedValue && errors.observedValue && styles.errorInput]}
                      placeholder="Observed value"
                      value={values.observedValue}
                      onChangeText={handleChange('observedValue')}
                      onBlur={handleBlur('observedValue')}
                    />
                    {touched.observedValue && errors.observedValue && <Text style={styles.errorText}>{errors.observedValue}</Text>}

                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      value={values.unit}
                      editable={!selectedTest}
                      onChangeText={handleChange('unit')}
                    />

                    <Text style={styles.label}>Reference Range</Text>
                    <TextInput
                      style={styles.input}
                      value={values.referenceRange}
                      editable={!selectedTest}
                      onChangeText={handleChange('referenceRange')}
                    />

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
                  </>
                )}
              </Formik>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

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
              onPress={() => setTestSelectionModalVisible(true)}
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
                    <Text style={styles.testName}>{(item as any).testName}</Text>

                    {('multiInput' in item && item.multiInput) ? (
                      (item as MultiTestResult).parameters.map((p, i) => (
                        <View key={i} style={{ marginTop: 6 }}>
                          <Text style={styles.testValue}>
                            {p.parameterName}: {p.observedValue} {p.unit}
                          </Text>
                          <Text style={styles.testRange}>Ref: {p.referenceRange}</Text>
                        </View>
                      ))
                    ) : (
                      <>
                        <Text style={styles.testValue}>
                          {(item as SingleTestResult).observedValue} {(item as SingleTestResult).unit}
                        </Text>
                        <Text style={styles.testRange}>
                          Reference: {(item as SingleTestResult).referenceRange}
                        </Text>
                      </>
                    )}
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
          style={[
            styles.submitButton,
            (tests.length === 0 || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleSubmitReport}
          disabled={tests.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Generate Report</Text>
          )}
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
    alignItems: 'flex-start',
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
    marginLeft: 10,
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
    marginBottom: 10,
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
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
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

  /* Multi input specific */
  multiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navArrow: {
    padding: 8,
  },
  disabledArrow: {
    opacity: 0.4,
  },
  arrowText: {
    fontSize: 20,
  },
  disabledArrowText: {
    color: '#999',
  },
  paramTitleWrap: {
    alignItems: 'center',
  },
  paramTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  paramSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  label: {
    fontSize: 13,
    color: '#34495e',
    marginBottom: 6,
    marginTop: 6,
  },
});

export default TestInputScreen;
