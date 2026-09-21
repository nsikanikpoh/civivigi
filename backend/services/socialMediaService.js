// Twitter/X, Facebook and Instagram publishing for verified cases.
//
// Each platform is independently env-var-gated, so the POC can demo the
// full flow with zero real accounts (everything logs to console), and each
// one activates for real the moment its credentials are supplied.

const axios = tryRequireAxios();

function tryRequireAxios() {
  try {
    return require("axios");
  } catch {
    return null;
  }
}

function buildCaseCaption(caseDoc) {
  return (
    `⚠️ Verified ${caseDoc.type} report in ${[caseDoc.city, caseDoc.region, caseDoc.country]
      .filter(Boolean)
      .join(", ")}.\n` +
    `${caseDoc.description}\n` +
    `Stay alert. Reported & verified via CiviVigi.`
  );
}

async function postToTwitter(caseDoc) {
  const token = process.env.TWITTER_BEARER_TOKEN;
  const text = buildCaseCaption(caseDoc);

  if (!token) {
    console.log(`[twitter:MOCK] would tweet:\n${text}\n`);
    return { mocked: true, platform: "twitter", text };
  }

  const res = await axios.post(
    "https://api.twitter.com/2/tweets",
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return { mocked: false, platform: "twitter", id: res.data?.data?.id };
}

async function postToFacebook(caseDoc) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const message = buildCaseCaption(caseDoc);

  if (!token || !pageId) {
    console.log(`[facebook:MOCK] would post to page:\n${message}\n`);
    return { mocked: true, platform: "facebook", message };
  }

  const res = await axios.post(`https://graph.facebook.com/${pageId}/feed`, null, {
    params: { message, access_token: token },
  });
  return { mocked: false, platform: "facebook", id: res.data?.id };
}

async function postToInstagram(caseDoc) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const caption = buildCaseCaption(caseDoc);

  if (!token || !igUserId) {
    console.log(`[instagram:MOCK] would post:\n${caption}\n`);
    return { mocked: true, platform: "instagram", caption };
  }

  // Instagram Graph API requires an image_url for feed posts; for the POC
  // we fall back to a generic alert graphic if the case has none.
  const imageUrl =
    caseDoc.imageUrl || "https://placehold.co/1080x1080?text=CiviVigi+Alert";

  const container = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, null, {
    params: { image_url: imageUrl, caption, access_token: token },
  });
  const publish = await axios.post(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    null,
    { params: { creation_id: container.data.id, access_token: token } }
  );
  return { mocked: false, platform: "instagram", id: publish.data?.id };
}

/**
 * Publishes a verified case to all three platforms. Failures on one
 * platform don't block the others.
 */
async function publishVerifiedCase(caseDoc) {
  const results = await Promise.allSettled([
    postToTwitter(caseDoc),
    postToFacebook(caseDoc),
    postToInstagram(caseDoc),
  ]);
  return results;
}

module.exports = { publishVerifiedCase, postToTwitter, postToFacebook, postToInstagram };
