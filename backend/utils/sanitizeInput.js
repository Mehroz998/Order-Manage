export const sanitizeInput = (obj) => {
    const sanitized = {};

    for (let key in obj) {
        if (typeof obj[key] === "string") {
            
            let value = obj[key]
                .trim()                     // Remove extra whitespace from start & end
                .replace(/<[^>]*>/g, "")    // Remove HTML tags
                .replace(/\s+/g, " ")       // Multiple spaces → single space
                .replace(/&/g, "&amp;")     // Escape &
                .replace(/</g, "&lt;")      // Escape <
                .replace(/>/g, "&gt;")      // Escape >
                .replace(/"/g, "&quot;")    // Escape "
                .replace(/'/g, "&#039;");   // Escape '

            // email ko lowercase karna
            if (key === "email") {
                value = value.toLowerCase();
            }

            sanitized[key] = value;

        } else {
            sanitized[key] = obj[key];
        }
    }

    return sanitized;
};
