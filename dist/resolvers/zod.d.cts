import { e as Resolver } from '../types-CZnFTbdo.cjs';

interface ZodIssueLike {
    code?: string;
    message: string;
    path: Array<number | string>;
}
interface ZodErrorLike {
    issues?: ZodIssueLike[];
    errors?: ZodIssueLike[];
}
interface ZodSchemaLike<TValues> {
    safeParse: (values: unknown) => {
        data?: TValues;
        error?: ZodErrorLike;
        success: boolean;
    };
}
declare function zodResolver<TValues extends object>(schema: ZodSchemaLike<TValues>): Resolver<TValues>;

export { zodResolver };
