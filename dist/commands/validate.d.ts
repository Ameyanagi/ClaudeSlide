interface ValidateOptions {
    fix?: boolean;
}
interface ValidationError {
    severity: "error" | "warning" | "info";
    code: string;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
    fixable?: boolean;
    fixAction?: () => boolean;
}
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    info: ValidationError[];
}
export declare function validateCommand(options?: ValidateOptions): Promise<void>;
declare function validate(workDir: string): Promise<ValidationResult>;
export { validate };
//# sourceMappingURL=validate.d.ts.map