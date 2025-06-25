# API Documentation

This directory contains API documentation for various integrations and services used by Workflow Bolt.

## 📁 Contents

### FHIR API

- [FHIR API Documentation (PDF)](FHIR%20API%20Documentation.pdf)
- [FHIR API Documentation (Text)](FHIR-API-Documentation.txt) - Text version for searchability

### Macra Open API

- [Macra Open API Documentation (PDF)](macra-open-api-documentation.pdf)
- [Macra Open API Documentation (Text)](macra-open-api-documentation.txt) - Text version for searchability

### Tebra API

- [Tebra API Integration Technical Guide (PDF)](Tebra%20API%20Integration%20Technical%20Guide.pdf)
- [Tebra API Integration Technical Guide (Text)](Tebra-API-Integration-Technical-Guide.txt) - Text version
- [Tebra API Examples (PHP)](tebra_api_examples.php) - Code examples for Tebra SOAP API

## 🔗 Related Documentation

- [Tebra Integration Documentation](../tebra-integration/) - Implementation details
- [Architecture Documentation](../architecture/) - System design
- [Security Documentation](../security/) - API security guidelines

## 📋 API Quick Reference

### Tebra SOAP API Endpoints

- `GetAppointments` - Retrieve appointment data
- `GetProviders` - Get provider list
- `GetPatient` - Fetch patient details
- `CreateAppointment` - Schedule new appointment
- `UpdateAppointment` - Modify existing appointment

### FHIR Resources

- Patient
- Appointment
- Practitioner
- Location
- Schedule

## 🔐 Security Notes

All API integrations must comply with HIPAA requirements:

- Use encrypted connections (HTTPS/TLS)
- Implement proper authentication
- Log access for audit trails
- Handle PHI securely
