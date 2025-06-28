# Tebra API Credential History

## Failed Credentials (2025-06-23)

**Status:** Authentication Failed - "Invalid user name and/or password"
- **Username:** pMUfiUwHGtQ@luknerclinic.com
- **Password:** y3l7-i7p56-S497G
- **Customer Key:** j57wt68dc39q (VALID - CustomerKeyValid: 1)
- **Practice Name:** Lukner Medical Clinic
- **Practice ID:** 67149

**Endpoints Tested:**
- ✅ Customer Key validation passes
- ❌ GetProviders - Authentication failed
- ❌ GetAppointments - Authentication failed

**Working Historical Reference (June 23rd):**
- Same SOAP structure successfully returned 1, 15, 4, 8 appointments for dates 2025-06-22 through 2025-06-25
- Previous working username: pMUfBo-XxHGtQ@luknerclinic.com  
- Previous working password: 094-W39XSn-TFjP8

## SOLUTION: New Account Created (2025-06-23)

**Root Cause:** The previous account was likely disabled or suspended by Tebra, causing authentication failures despite correct credentials.

**Resolution:** Created new Tebra account with working credentials.

**Working Credentials (CURRENT):**
- **Username:** workfl278290@luknerclinic.com
- **Password:** LS35-O28Bc-71n
- **Customer Key:** j57wt68dc39q (unchanged - was always valid)
- **Practice Name:** Lukner Medical Clinic
- **Practice ID:** 67149

**Test Results:**
- ✅ GetProviders: Authentication SUCCESS, 1 provider found
- ✅ GetAppointments: Authentication SUCCESS, 4 appointments found
- ✅ Cloud Run deployment: COMPLETED
- ✅ End-to-end SOAP integration: RESTORED

**Files Updated:**
1. `src/TebraHttpClient.php` - Lines 28-29 (hardcoded working credentials)
2. `test-hardcoded-soap.php` - Lines 9-10 
3. `test-providers.php` - Lines 8-9
4. `test-new-account.php` - Lines 9-10
5. Cloud Run service deployed with working config

**Next Steps:**
- Monitor new account for any usage limits or restrictions
- Consider moving credentials back to Secret Manager once stable
- Update Firebase Functions proxy to use new Cloud Run deployment

## Template for Future Accounts

```php
$config = [
    'wsdl'        => 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    'username'    => 'NEW_USERNAME_HERE',
    'password'    => 'NEW_PASSWORD_HERE',
    'customerKey' => 'j57wt68dc39q', // Keep existing - validates successfully
    'practiceName'=> 'Lukner Medical Clinic',
    'practiceId'  => '67149',
];
```

## Files to Update After New Account Creation

1. `tebra-php-api/src/TebraHttpClient.php` - Lines 28-30
2. `tebra-php-api/test-hardcoded-soap.php` - Lines 9-10
3. `tebra-php-api/test-providers.php` - Lines 9-10
4. Cloud Run deployment secrets