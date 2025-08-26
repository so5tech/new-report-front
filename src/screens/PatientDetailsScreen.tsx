import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';

const patientSchema = yup.object().shape({
  patientName: yup.string().required('Patient name is required'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .positive('Age must be positive')
    .integer('Age must be an integer')
    .max(150, 'Age must be less than 150')
    .required('Age is required'),
  gender: yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
  patientId: yup.string().required('Patient ID is required'),
  doctorName: yup.string().required('Doctor name is required'),
});

interface PatientDetailsScreenProps {
  route: any;
}

const PatientDetailsScreen: React.FC<PatientDetailsScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { patientData } = route.params || {};

  const handleSubmit = (values: any) => {
    navigation.navigate('TestInput', { patientData: values });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Details</Text>
        <Text style={styles.subtitle}>Enter patient information</Text>
      </View>

      <Formik
        initialValues={{
          patientName: patientData?.patientName || '',
          age: patientData?.age?.toString() || '',
          gender: patientData?.gender || 'Male',
          patientId: patientData?.patientId || '',
          doctorName: patientData?.doctorName || '',
        }}
        validationSchema={patientSchema}
        onSubmit={handleSubmit}
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
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient Name *</Text>
              <TextInput
                style={[styles.input, touched.patientName && errors.patientName && styles.errorInput]}
                placeholder="Enter patient name"
                value={values.patientName}
                onChangeText={handleChange('patientName')}
                onBlur={handleBlur('patientName')}
              />
              {touched.patientName && errors.patientName && (
                <Text style={styles.errorText}>{errors.patientName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={[styles.input, touched.age && errors.age && styles.errorInput]}
                placeholder="Enter age"
                value={values.age}
                onChangeText={handleChange('age')}
                onBlur={handleBlur('age')}
                keyboardType="numeric"
              />
              {touched.age && errors.age && (
                <Text style={styles.errorText}>{errors.age}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.radioGroup}>
                {['Male', 'Female', 'Other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioButton,
                      values.gender === option && styles.radioButtonSelected,
                    ]}
                    onPress={() => setFieldValue('gender', option)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        values.gender === option && styles.radioTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {touched.gender && errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient ID *</Text>
              <TextInput
                style={[styles.input, touched.patientId && errors.patientId && styles.errorInput]}
                placeholder="Enter patient ID"
                value={values.patientId}
                onChangeText={handleChange('patientId')}
                onBlur={handleBlur('patientId')}
                autoCapitalize="none"
              />
              {touched.patientId && errors.patientId && (
                <Text style={styles.errorText}>{errors.patientId}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doctor Name *</Text>
              <TextInput
                style={[styles.input, touched.doctorName && errors.doctorName && styles.errorInput]}
                placeholder="Enter doctor name"
                value={values.doctorName}
                onChangeText={handleChange('doctorName')}
                onBlur={handleBlur('doctorName')}
              />
              {touched.doctorName && errors.doctorName && (
                <Text style={styles.errorText}>{errors.doctorName}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmit()}
            >
              <Text style={styles.submitButtonText}>Next: Add Tests</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  radioText: {
    color: '#7f8c8d',
  },
  radioTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientDetailsScreen;