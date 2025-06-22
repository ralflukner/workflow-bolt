const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function testAudiences() {
  const gsm = new SecretManagerServiceClient();
  const PROJECT_ID = 'luknerlumina-firebase';

  try {
    // Get secrets
    const [domainVersion] = await gsm.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/AUTH0_DOMAIN/versions/latest`
    });
    const [audienceVersion] = await gsm.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/AUTH0_AUDIENCE/versions/latest`
    });

    const auth0Domain = domainVersion.payload?.data?.toString();
    const auth0Audience = audienceVersion.payload?.data?.toString();

    console.log('Domain:', JSON.stringify(auth0Domain));
    console.log('Audience:', JSON.stringify(auth0Audience));
    
    // Test expected audiences
    const expectedAudiences = [
      auth0Audience,
      `https://${auth0Domain}/userinfo`
    ];
    
    console.log('Expected audiences:', expectedAudiences);
    
    // Test the actual token audiences
    const tokenAudiences = ["https://api.patientflow.com", "https://dev-uex7qzqmd8c4qnde.us.auth0.com/userinfo"];
    console.log('Token audiences:', tokenAudiences);
    
    // Check if they match
    const audienceMatch = expectedAudiences.some(expected => 
      tokenAudiences.includes(expected)
    );
    
    console.log('Audience match:', audienceMatch);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAudiences();