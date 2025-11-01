export function extractContentType(headers: HeadersInit = {}): string | undefined {
    const normalizedHeaders = headers instanceof Array ? Object.fromEntries(headers) : headers
    for (const k in normalizedHeaders) {
        if (k.toLowerCase() === 'content-type') return normalizedHeaders[k]
    }
}

export function isLikelyJsonMime(value: string): boolean {
    return /^application\/.*json/.test(value)
}

export const mix = (one: object, two: object, mergeArrays = false) => {
    const acc = {...one}
    for (const key in two) {
        if (!Object.prototype.hasOwnProperty.call(two, key)) continue
        const value = one[key]
        const newValue = two[key]
        acc[key] = Array.isArray(value) && Array.isArray(newValue) ?
            mergeArrays ? [...value, ...newValue] : newValue :
            typeof value === 'object' && typeof newValue === 'object' ?
                mix(value, newValue, mergeArrays) :
                newValue
    }
    return acc
}

export const isObject = (value: unknown): boolean => {
    return Object.prototype.toString.call(value) === '[object Object]'
}

export const isArray = (value: unknown): boolean => {
    return Array.isArray(value)
}
export const isString = (value: unknown): boolean => {
    return typeof value === 'string'
}