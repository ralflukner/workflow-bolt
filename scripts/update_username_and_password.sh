#!/opt/homebrew/bin/bash

# Prompt securely for username
printf "Enter Tebra username: "
read -r USERNAME

# Prompt securely for password
printf "Enter Tebra password: "
read -rs PASSWORD

echo  # Prints a newline after password input

# Update username secret
echo -n "$USERNAME" | gcloud secrets versions add TEBRA_USERNAME --data-file=-
if [ $? -eq 0 ]; then
    echo "✅ Username updated successfully"
else
    echo "❌ Failed to update username"
fi

# Update password secret
echo -n "$PASSWORD" | gcloud secrets versions add TEBRA_PASSWORD --data-file=-
if [ $? -eq 0 ]; then
    echo "✅ Password updated successfully"
else
    echo "❌ Failed to update password"
fi