import type {ConfiguredMiddleware, FetchLike} from './type'

/**
 * @private @internal
 */
export const middlewareHelper = (middlewares: ConfiguredMiddleware[]) => (fetchFunction: FetchLike): FetchLike =>
    middlewares.reduceRight((acc, curr) => curr(acc), fetchFunction)