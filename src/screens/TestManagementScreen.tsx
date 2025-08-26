import React, { useState, useEffect } from 'react';
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
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const testSchema = yup.object().shape({
  testName: yup.string().required('Test name is required'),
  referenceValue: yup.string().required('Reference value is required'),
  unit: yup.string().required('Unit is required'),
  category: yup.string().oneOf(['Blood', 'Urine', 'Stool', 'Imaging', 'Other']).required('Category is required'),
  description: yup.string(),
});

interface Test {
  _id: string;
  testName: string;
  referenceValue: string;
  unit: string;
  category: string;
  description: string;
  isActive: boolean;
}

const TestManagementScreen: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tests`);
      setTests(response.data.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
      Alert.alert('Error', 'Failed to fetch tests');
    }
  };

  const handleAddTest = async (values: any) => {
    try {
      if (editingTest) {
        console.log("herelj----")
        const response = await axios.put(
          `${API_BASE_URL}/tests/${editingTest._id}`,
          values
        );
        setTests(tests.map(test => 
          test._id === editingTest._id ? response.data.data : test
        ));
        Alert.alert('Success', 'Test updated successfully');
      } else {
        console.log("herel----", values)
        const response = await axios.post(`${API_BASE_URL}/tests`, values);
        setTests([...tests, response.data.data]);
        Alert.alert('Success', 'Test added successfully');
      }
      setModalVisible(false);
      setEditingTest(null);
    } catch (error) {
      console.error('Error saving test:', error);
      Alert.alert('Error', 'Failed to save test');
    }
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setModalVisible(true);
  };

  const handleDeleteTest = async (testId: string) => {
    Alert.alert(
      'Delete Test',
      'Are you sure you want to delete this test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/tests/${testId}`);
              setTests(tests.filter(test => test._id !== testId));
              Alert.alert('Success', 'Test deleted successfully');
            } catch (error) {
              console.error('Error deleting test:', error);
              Alert.alert('Error', 'Failed to delete test');
            }
          },
        },
      ]
    );
  };

  const TestModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
        setEditingTest(null);
      }}
    >
      <ScrollView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingTest ? 'Edit Test' : 'Add New Test'}
          </Text>
          
          <Formik
            initialValues={{
              testName: editingTest?.testName || '',
              referenceValue: editingTest?.referenceValue || '',
              unit: editingTest?.unit || '',
              category: editingTest?.category || 'Blood',
              description: editingTest?.description || '',
            }}
            validationSchema={testSchema}
            onSubmit={handleAddTest}
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Test Name *</Text>
                  <TextInput
                    style={[styles.input, touched.testName && errors.testName && styles.errorInput]}
                    placeholder="Enter test name"
                    value={values.testName}
                    onChangeText={handleChange('testName')}
                    onBlur={handleBlur('testName')}
                  />
                  {touched.testName && errors.testName && (
                    <Text style={styles.errorText}>{errors.testName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.pickerContainer}>
                    {['Blood', 'Urine', 'Stool', 'Imaging', 'Other'].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          values.category === category && styles.categoryButtonSelected,
                        ]}
                        onPress={() => setFieldValue('category', category)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            values.category === category && styles.categoryTextSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.category && errors.category && (
                    <Text style={styles.errorText}>{errors.category}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reference Value *</Text>
                  <TextInput
                    style={[styles.input, touched.referenceValue && errors.referenceValue && styles.errorInput]}
                    placeholder="Enter reference value/range"
                    value={values.referenceValue}
                    onChangeText={handleChange('referenceValue')}
                    onBlur={handleBlur('referenceValue')}
                  />
                  {touched.referenceValue && errors.referenceValue && (
                    <Text style={styles.errorText}>{errors.referenceValue}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit *</Text>
                  <TextInput
                    style={[styles.input, touched.unit && errors.unit && styles.errorInput]}
                    placeholder="Enter unit (e.g., mg/dL, mmol/L)"
                    value={values.unit}
                    onChangeText={handleChange('unit')}
                    onBlur={handleBlur('unit')}
                  />
                  {touched.unit && errors.unit && (
                    <Text style={styles.errorText}>{errors.unit}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.textarea, touched.description && errors.description && styles.errorInput]}
                    placeholder="Enter description (optional)"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    multiline
                    numberOfLines={3}
                  />
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      setEditingTest(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={() => handleSubmit()}
                  >
                    <Text style={styles.buttonText}>
                      {editingTest ? 'Update' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Library</Text>
        <Text style={styles.subtitle}>Manage available tests</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Test</Text>
      </TouchableOpacity>

      <FlatList
        data={tests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.testItem}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{item.testName}</Text>
              <Text style={styles.testCategory}>{item.category}</Text>
              <Text style={styles.testDetails}>
                {item.referenceValue} {item.unit}
              </Text>
              {item.description && (
                <Text style={styles.testDescription}>{item.description}</Text>
              )}
            </View>
            <View style={styles.testActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditTest(item)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteTest(item._id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tests found</Text>
            <Text style={styles.emptySubtext}>Add your first test to get started</Text>
          </View>
        }
      />

      <TestModal />
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
  addButton: {
    backgroundColor: '#3498db',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
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
  testCategory: {
    fontSize: 12,
    color: '#3498db',
    marginBottom: 2,
  },
  testDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  testDescription: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  testActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
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
  modalContainer: {
    flex: 1,
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
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 2,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
  },
  categoryButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryText: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  categoryTextSelected: {
    color: '#fff',
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
  saveButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TestManagementScreen;