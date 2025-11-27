interface InitOptions {
    name?: string;
    output?: string;
    force?: boolean;
    git?: boolean;
}
export declare function initCommand(pptxFile: string | undefined, options: InitOptions): Promise<void>;
export {};
//# sourceMappingURL=init.d.ts.map