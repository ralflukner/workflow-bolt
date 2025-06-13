# Update username secret
echo -n 'NUgUNU-2XimuM-ELeK9@luknerclinic.com' | \
  gcloud secrets versions add tebra-username --data-file=-

# Update password secret
echo -n 'he~tux-96$ed9U-h3U@F7-4U(9Su-mU{+ze' | \
  gcloud secrets versions add tebra-password --data-file=-

# Verify both were updated
gcloud secrets versions list tebra-username
gcloud secrets versions list tebra-password