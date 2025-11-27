export interface SlideInfo {
    number: number;
    title: string;
    contentPreview: string;
}
export interface PresentationInfo {
    title: string;
    author: string;
    slideCount: number;
    slides: SlideInfo[];
}
export declare function generateClaudeMd(projectName: string, info: PresentationInfo): string;
//# sourceMappingURL=claude-md.d.ts.map