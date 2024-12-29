import * as monaco from 'monaco-editor'
// @ts-expect-error
import { language as tsLanguage } from 'monaco-editor/esm/vs/basic-languages/typescript/typescript.js'

import 'monaco-editor/esm/vs/basic-languages/html/html.contribution'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

export class MonacoProvider {
  public static run() {
    MonacoProvider.workerSetup();
    MonacoProvider.languageSetup();
    MonacoProvider.themeSetup();
  }

  private static workerSetup() {
    Object.assign(tsLanguage, {
      ...tsLanguage,
      tokenizer: {
        ...tsLanguage.tokenizer,
        common: [
          [/\b([a-zA-Z_$][\w$]*)(?=\.)/, 'custom-object'],
          [/\b([a-zA-Z_$][\w$]*)(?=\()/, 'custom-method'],
          ...tsLanguage.tokenizer.common,
        ]
      }
    });

    self.MonacoEnvironment = {
      getWorker(_, label) {
        switch (label) {
          case 'json':
            return new jsonWorker()
          case 'css':
          case 'scss':
          case 'less':
            return new cssWorker()
          case 'html':
          case 'handlebars':
          case 'razor':
            return new htmlWorker()
          case 'typescript':
          case 'javascript':
            return new tsWorker()
          default:
            return new editorWorker()
        }
      }
    }
  }

  private static languageSetup() {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false
    })
    
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ["node_modules/@types"]
    })
    
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })
    
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
    
    monaco.languages.typescript.javascriptDefaults.setModeConfiguration({
      completionItems: true,
      hovers: true,
      documentSymbols: true,
      diagnostics: true,
    })
    
    // Добавляем настройки для HTML
    monaco.languages.html.htmlDefaults.setModeConfiguration({
      completionItems: true,
      hovers: true,
      documentSymbols: true,
      links: true,
    })
  }

  private static themeSetup() {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: false,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'method', foreground: 'C586C0' },
        { token: 'property', foreground: '9CDCFE' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'function', foreground: 'C586C0' },
        { token: 'custom-object', foreground: '9CDCFE' },
        { token: 'custom-method', foreground: 'C586C0' },
        { token: 'tag', foreground: '569CD6' },
        { token: 'tag.id', foreground: '569CD6' },
        { token: 'tag.class', foreground: '569CD6' },
        { token: 'attribute.name', foreground: '9CDCFE' },
        { token: 'attribute.value', foreground: 'CE9178' },
        { token: 'delimiter.html', foreground: '808080' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
      },
    });

    monaco.editor.setTheme('custom-dark');
  }
}