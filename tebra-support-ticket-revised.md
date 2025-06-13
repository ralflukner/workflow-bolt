
# Tebra API Support Request - InternalServiceFault Error

**Account Information:**

- **Main Tebra Account:** `lukner@gmail.com` / `lukner@luknerclinic.com`

- **API Username:** `work-flow@luknerclinic.com` (dedicated API account)

- **Customer Key:** j57wt68dc39q

- **WSDL URL:** `https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl`

**Issue Description:**
All SOAP API operations consistently return InternalServiceFault error from
dedicated API account `work-flow@luknerclinic.com`.

**System Integration Context:**

- **Current System:** Clinic workflow management system (Lukner Clinic)

- **API Account:** `work-flow@luknerclinic.com` (dedicated for this integration)

- **Note:** Aledade ACO has separate API credentials (not sharing same account)

---

## Request and Response XMLs (Required by Tebra Template)

### 1. GetProviders Operation

**REQUEST XML:**

```xml
POST https://webservice.kareo.com/services/soap/2.1/KareoServices.svc HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.kareo.com/ServiceContracts/2.1/GetProviders"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:kar="http://www.kareo.com/ServiceContracts/2.1">
  <soap:Header>
    <kar:RequestHeader>
      <kar:CustomerKey>j57wt68dc39q</kar:CustomerKey>
      <kar:User>work-flow@luknerclinic.com</kar:User>
      <kar:Password>s?3dVK=iXBj73*i$%5i8/5&lt;4xtiP9?</kar:Password>
    </kar:RequestHeader>
  </soap:Header>
  <soap:Body>
    <kar:GetProviders />
  </soap:Body>
</soap:Envelope>

```

**RESPONSE XML:**

```xml
HTTP/1.1 500 Internal Server Error
Content-Type: text/xml; charset=utf-8

<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <s:Fault>
      <faultcode>a:InternalServiceFault</faultcode>
      <faultstring>The server was unable to process the request due to an
      internal error.</faultstring>
    </s:Fault>
  </s:Body>
</s:Envelope>

```

### 2. GetAppointments Operation

**REQUEST XML:**

```xml
POST https://webservice.kareo.com/services/soap/2.1/KareoServices.svc HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.kareo.com/ServiceContracts/2.1/GetAppointments"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:kar="http://www.kareo.com/ServiceContracts/2.1">
  <soap:Header>
    <kar:RequestHeader>
      <kar:CustomerKey>j57wt68dc39q</kar:CustomerKey>
      <kar:User>work-flow@luknerclinic.com</kar:User>
      <kar:Password>s?3dVK=iXBj73*i$%5i8/5&lt;4xtiP9?</kar:Password>
    </kar:RequestHeader>
  </soap:Header>
  <soap:Body>
    <kar:GetAppointments>
      <kar:request>
        <kar:FromDate>2025-01-13</kar:FromDate>
        <kar:ToDate>2025-01-13</kar:ToDate>
      </kar:request>
    </kar:GetAppointments>
  </soap:Body>
</soap:Envelope>

```

**RESPONSE XML:**

```xml
HTTP/1.1 500 Internal Server Error
Content-Type: text/xml; charset=utf-8

<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <s:Fault>
      <faultcode>a:InternalServiceFault</faultcode>
      <faultstring>The server was unable to process the request due to an
      internal error.</faultstring>
    </s:Fault>
  </s:Body>
</s:Envelope>

```

### 3. GetPractices Operation

**REQUEST XML:**

```xml
POST https://webservice.kareo.com/services/soap/2.1/KareoServices.svc HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.kareo.com/ServiceContracts/2.1/GetPractices"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:kar="http://www.kareo.com/ServiceContracts/2.1">
  <soap:Header>
    <kar:RequestHeader>
      <kar:CustomerKey>j57wt68dc39q</kar:CustomerKey>
      <kar:User>work-flow@luknerclinic.com</kar:User>
      <kar:Password>s?3dVK=iXBj73*i$%5i8/5&lt;4xtiP9?</kar:Password>
    </kar:RequestHeader>
  </soap:Header>
  <soap:Body>
    <kar:GetPractices />
  </soap:Body>
</soap:Envelope>

```

**RESPONSE XML:**

```xml
HTTP/1.1 500 Internal Server Error
Content-Type: text/xml; charset=utf-8

<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <s:Fault>
      <faultcode>a:InternalServiceFault</faultcode>
      <faultstring>The server was unable to process the request due to an
      internal error.</faultstring>
    </s:Fault>
  </s:Body>
</s:Envelope>

```

---

## Technical Testing Evidence

**Authentication Verification:**

- No 401 Unauthorized errors received (credentials working correctly)

- All operations recognized by API (no 404 Not Found errors)

- SOAP format accepted (no malformed request errors)

**Multiple Operations Tested:**

- GetProviders: ❌ InternalServiceFault

- GetAppointments: ❌ InternalServiceFault

- GetPractices: ❌ InternalServiceFault

- All operations return identical fault response

**Network Connectivity:**

```bash
$ curl -I https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl
HTTP/1.1 200 OK
Content-Type: text/xml; charset=utf-8

```

**SOAP Operation Testing (curl demonstrations):**

GetProviders curl test:

```bash
$ curl -X POST https://webservice.kareo.com/services/soap/2.1/KareoServices.svc \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: http://www.kareo.com/ServiceContracts/2.1/GetProviders" \
  -d '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:kar="http://www.kareo.com/ServiceContracts/2.1">
  <soap:Header>
    <kar:RequestHeader>
      <kar:CustomerKey>j57wt68dc39q</kar:CustomerKey>
      <kar:User>work-flow@luknerclinic.com</kar:User>
      <kar:Password>s?3dVK=iXBj73*i$%5i8/5<4xtiP9?</kar:Password>
    </kar:RequestHeader>
  </soap:Header>
  <soap:Body>
    <kar:GetProviders />
  </soap:Body>
</soap:Envelope>'

# Response:

<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <s:Fault>
      <faultcode>a:InternalServiceFault</faultcode>
      <faultstring>The server was unable to process the request due to an
      internal error.</faultstring>
    </s:Fault>
  </s:Body>
</s:Envelope>

```

**Consistency:**

- Error occurs on 100% of API calls

- Same fault code across all operations

- Started occurring recently (previously working)

---

## Client Implementation Details

**SOAP Client:** Node.js with 'soap' library v1.1.6
**Protocol:** SOAP 1.1 with BasicHttpBinding
**Content-Type:** text/xml; charset=utf-8
**Security:** Basic Authentication (Username/Password in SOAP Header)

**Rate Limiting:** Implemented per Tebra documentation

- GetProviders: 500ms intervals

- GetAppointments: 1000ms intervals

- No rate limit violations detected

---

## Impact Assessment

**Current Status:** Complete API service unavailable
**Business Impact:** Unable to sync patient schedules for clinic workflow system
**Workaround:** Using fallback mock data temporarily
**Urgency:** High - affects daily clinic operations

---

## Questions for Tebra Support

1. **API Account Status:** Is there any issue with API account
   `work-flow@luknerclinic.com` permissions or status?

2. **InternalServiceFault Root Cause:** What server-side conditions typically
   cause this specific fault across all operations?

3. **Account Configuration:** Are there any account-level restrictions or
   configuration issues affecting API access?

4. **Service Status:** Is there a known service issue affecting the SOAP API
   endpoints?

---

## Request for Support

Per Tebra's troubleshooting template, requesting engineering investigation of
server-side InternalServiceFault affecting all SOAP operations for API account
`work-flow@luknerclinic.com`. The consistent fault across all operations
suggests a server-side configuration or account-level issue rather than client
implementation problem.

**Contact Information:**

- **Email:** `ralf.b.lukner.md.phd@gmail.com`

- **Phone:** Available upon request

- **Preferred Response:** Email with technical analysis and resolution steps
