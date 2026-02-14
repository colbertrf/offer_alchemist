// Capture affiliate ref from URL and store it
export function captureAffiliateRef() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("affiliate_ref", ref);
}

// Retrieve affiliate ref for checkout
export function getAffiliateRef() {
    return localStorage.getItem("affiliate_ref") || "";
}
