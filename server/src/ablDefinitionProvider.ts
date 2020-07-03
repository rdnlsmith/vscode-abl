// Document Symbol Provider for Language Server

import * as vscode from 'vscode-languageserver';
import { ParseDocument, ParseItem } from './ablParser';

export function provideDocumentSymbols(
    document: vscode.TextDocument, token: vscode.CancellationToken):
    vscode.SymbolInformation[] {
    
    const symbolInformationResult: vscode.SymbolInformation[] = [];
    try {

        // Parse the Document for possible values
        const symbols: ParseItem[] = ParseDocument(document, token);

        for (const symbol of symbols) {
            let line = symbol.line;
            if (!line) {
                line = 0;
            }
            const range: vscode.Range = {
                end: { line: line + 1, character: 0 },
                start: {line, character: 0 },
            };
            const pLoc: vscode.Location = { uri: document.uri, range };
            const symbolInformation: vscode.SymbolInformation = {
                kind: symbol.type,
                location: pLoc,
                name: symbol.name,
            };
            symbolInformationResult.push(symbolInformation);
        }
    } catch { }

    return symbolInformationResult;
}
