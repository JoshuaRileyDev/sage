import { OAuth } from "@raycast/api";
import fetch from "node-fetch";

// Register a new OAuth app via https://developer.twitter.com/en/portal/dashboard
// Select OAuth 2.0
// As type of app choose: Native App
// For the redirect URL enter: https://raycast.com/redirect
// For the website URL enter: https://raycast.com
const clientId = "a30eb717-39e7-c55a-b6c4-c59add3a2a40/2c26d03f-88de-4031-9290-32932e693afc";

const client = new OAuth.PKCEClient({
    redirectMethod: OAuth.RedirectMethod.App,
    providerName: "Sage One",
    providerIcon: "command-icon.png",
    description: "Connect your Sage One account",
});



// Authorization
export async function authorize(): Promise<void> {
    console.log("Starting authorization process...");
    const tokenSet = await client.getTokens();

    // If we have a valid token, use it
    if (tokenSet?.accessToken) {
        console.log("Found existing access token");
        if (tokenSet.refreshToken && tokenSet.isExpired()) {
            console.log("Token expired, refreshing...");
            await client.setTokens(await refreshTokens(tokenSet.refreshToken));
            console.log("Token refreshed successfully");
        } else {
            console.log("Token still valid, no refresh needed");
        }
        return;
    }

    // Otherwise get a new token
    console.log("No existing token found, starting new authorization flow");
    const authRequest = await client.authorizationRequest({
        endpoint: "https://www.sageone.com/oauth2/auth/central?response_type=code",
        clientId: clientId,
        scope: "full_access",
    });
    console.log("Authorization request created");

    const { authorizationCode } = await client.authorize(authRequest);
    console.log("Received authorization code:", authorizationCode);

    const tokens = await fetchTokens(authRequest, authorizationCode);
    await client.setTokens(tokens);
    console.log("Authorization complete - tokens stored successfully");
}

export async function fetchTokens(
    authRequest: OAuth.AuthorizationRequest,
    authCode: string
): Promise<OAuth.TokenResponse> {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("code", authCode);
    params.append("code_verifier", authRequest.codeVerifier);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", authRequest.redirectURI);

    const response = await fetch("https://oauth.accounting.sage.com/token", { method: "POST", body: params });
    if (!response.ok) {
        console.error("fetch tokens error:", await response.text());
        throw new Error(response.statusText);
    }
    return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    const response = await fetch("https://oauth.accounting.sage.com/token", { method: "POST", body: params });
    if (!response.ok) {
        console.error("refresh tokens error:", await response.text());
        throw new Error(response.statusText);
    }

    const tokenResponse = (await response.json()) as OAuth.TokenResponse;
    tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
    return tokenResponse;
}

// API

// export async function fetchItems(): Promise<{ id: string; title: string }[]> {
//     const params = new URLSearchParams();
//     params.append("query", "raycast");

//     const response = await fetch("https://api.twitter.com/2/tweets/search/recent?" + params.toString(), {
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${(await client.getTokens())?.accessToken}`,
//         },
//     });
//     if (!response.ok) {
//         console.error("fetch items error:", await response.text());
//         throw new Error(response.statusText);
//     }
//     const json = (await response.json()) as { data: { id: string; text: string }[] };
//     return json.data.map((item) => ({ id: item.id, title: item.text }));
// }