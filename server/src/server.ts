import {
    CompletionItem,
    CompletionItemKind,
    createConnection,
    Diagnostic,
    DiagnosticSeverity,
    DidChangeConfigurationNotification,
    DocumentSymbolParams,
    InitializeParams,
    Position,
    ProposedFeatures,
    SymbolInformation,
    SymbolKind,
    TextDocument,
    TextDocumentPositionParams,
    TextDocuments,
    VersionedTextDocumentIdentifier,
    CancellationToken,
} from 'vscode-languageserver';
import * as ablCompletionProvider from './ablCompletionProvider';
import * as ablDefinitionProvider from './ablDefinitionProvider';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments = new TextDocuments();
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
    let capabilities = params.capabilities;

    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: false,
            },
            documentSymbolProvider: true,
        },
    };
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

// interface ExampleSettings {
//     maxNumberOfProblems: number;
// }

// const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
// let globalSettings: ExampleSettings = defaultSettings;

// let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

// connection.onDidChangeConfiguration(change => {
//     if (hasConfigurationCapability) {
//         documentSettings.clear();
//     } else {
//         globalSettings = (
//             (change.settings.languageServerExample || defaultSettings)
//         ) as ExampleSettings;
//     }

//     documents.all().forEach(validateTextDocument);
// });

// function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
//     if (!hasConfigurationCapability) {
//         return Promise.resolve(globalSettings);
//     }
//     let result = documentSettings.get(resource);
//     if (!result) {
//         result = connection.workspace.getConfiguration({
//             scopeUri: resource,
//             section: 'languageServerExample'
//         });
//         documentSettings.set(resource, result);
//     }
//     return result;
// }

// documents.onDidClose((e) => {
//     documentSettings.delete(e.document.uri);
// });

documents.onDidChangeContent((change) => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
}

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received a file change event');
});

connection.onCompletion(
    (textDocumentPosition: TextDocumentPositionParams, token: CancellationToken): CompletionItem[] => {
        const document: TextDocument | undefined = documents.get(textDocumentPosition.textDocument.uri);
        const position: Position = textDocumentPosition.position;

        if (!document) {
            return [];
        }

        return ablCompletionProvider.provideCompletionItems(document, position, token);
    },
);

// connection.onCompletionResolve(
//     (item: CompletionItem): CompletionItem => { return new CompletionItem(); });
// )

connection.onDocumentSymbol(
    (symbolParams: DocumentSymbolParams, token: CancellationToken): SymbolInformation[] => {
        const document: TextDocument | undefined = documents.get(symbolParams.textDocument.uri);

        if (!document) {
            return [];
        }

        return ablDefinitionProvider.provideDocumentSymbols(document, token);
    },
);

documents.listen(connection);
connection.listen();
