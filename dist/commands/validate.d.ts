interface ValidationError {
    severity: "error" | "warning" | "info";
    code: string;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
}
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    info: ValidationError[];
}
export declare function validateCommand(): Promise<void>;
declare function validate(workDir: string): Promise<ValidationResult>;
export { validate };
//# sourceMappingURL=validate.d.ts.map