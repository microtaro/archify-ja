import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { throwDiagnosticError } from './diagnostics.mjs';
import { translateCliMessage } from './i18n.mjs';

const FULL_SHA_RE = /^[a-f0-9]{40}$/i;
const CONTROL_CHARACTER_RE = /[\u0000-\u001f\u007f]/;

function evidenceFailure(code, message, { subject = {}, evidence = {}, supportedFixes = [] } = {}) {
  throwDiagnosticError(message, [{
    code,
    severity: 'error',
    message,
    subject: { surface: 'repository-evidence', ...subject },
    evidence,
    supportedFixes,
  }]);
}

function runGit(repoRoot, args) {
  const result = spawnSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) evidenceFailure('repository-evidence/git-unavailable', translateCliMessage('evidence.git-unavailable', { reason: result.error.message }), {
    evidence: { reason: result.error.message },
    supportedFixes: [translateCliMessage('evidence.fix.install-git')],
  });
  return result;
}

function gitValue(repoRoot, args, failure) {
  const result = runGit(repoRoot, args);
  if (result.status !== 0) evidenceFailure('repository-evidence/git-command', failure, {
    evidence: { gitArgs: args, exitCode: result.status },
    supportedFixes: [translateCliMessage('evidence.fix.intended-repo')],
  });
  return result.stdout.trim();
}

function githubSlug(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : null;
}

function verifiedSourcePath(value, where) {
  const sourcePath = String(value || '');
  if (!sourcePath || sourcePath.startsWith('/') || sourcePath.includes('\\') || CONTROL_CHARACTER_RE.test(sourcePath)) {
    evidenceFailure('repository-evidence/path-invalid', translateCliMessage('evidence.path-invalid', { where }), {
      subject: { path: where },
      evidence: { authoredPath: sourcePath },
      supportedFixes: [translateCliMessage('evidence.fix.posix-path')],
    });
  }
  const segments = sourcePath.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..') || segments[0] === '.git') {
    evidenceFailure('repository-evidence/path-escape', translateCliMessage('evidence.path-escape', { where }), {
      subject: { path: where },
      evidence: { authoredPath: sourcePath },
      supportedFixes: [translateCliMessage('evidence.fix.clean-segments')],
    });
  }
  return segments.join('/');
}

function sourceHref(repositoryUrl, revision, source) {
  const encodedPath = source.path.split('/').map(encodeURIComponent).join('/');
  const lineFragment = source.line
    ? `#L${source.line}${source.endLine && source.endLine !== source.line ? `-L${source.endLine}` : ''}`
    : '';
  return `${repositoryUrl}/blob/${revision}/${encodedPath}${lineFragment}`;
}

function sourceLineCount(content) {
  if (!content.length) return 0;
  const lines = content.split(/\r\n|\n|\r/);
  return lines.length - (/(?:\r\n|\n|\r)$/.test(content) ? 1 : 0);
}

export function hasRepositoryEvidence(diagramType, diagram) {
  if (diagramType !== 'architecture') return false;
  const components = Array.isArray(diagram?.components) ? diagram.components : [];
  return Boolean(diagram?.meta?.repository) || components.some((component) => Array.isArray(component?.sources) && component.sources.length);
}

export function verifyRepositoryEvidence(diagramType, diagram, repoRootInput) {
  if (!hasRepositoryEvidence(diagramType, diagram)) return null;
  if (diagramType !== 'architecture') evidenceFailure('repository-evidence/type-unsupported', translateCliMessage('evidence.type-unsupported'), {
    subject: { diagramType },
    supportedFixes: [translateCliMessage('evidence.fix.architecture-mode')],
  });

  const repository = diagram.meta?.repository;
  if (!repository) evidenceFailure('repository-evidence/repository-required', translateCliMessage('evidence.repository-required'), {
    subject: { path: '/meta/repository' },
    supportedFixes: [translateCliMessage('evidence.fix.pin-metadata')],
  });
  if (!FULL_SHA_RE.test(repository.revision || '')) {
    evidenceFailure('repository-evidence/revision-invalid', translateCliMessage('evidence.revision-invalid'), {
      subject: { path: '/meta/repository/revision' },
      evidence: { revision: repository.revision },
      supportedFixes: [translateCliMessage('evidence.fix.pin-sha')],
    });
  }
  // A public repository URL is only needed to build clickable permalinks.
  // Verification itself is local, so omitting the URL keeps the evidence
  // verified and renders it as plain path + line instead of a link.
  const hasPublicUrl = typeof repository.url === 'string' && repository.url.length > 0;
  const canonicalUrl = hasPublicUrl
    ? repository.url.replace(/\.git\/?$/i, '').replace(/\/$/, '')
    : null;
  const authoredSlug = hasPublicUrl ? githubSlug(repository.url) : null;
  if (hasPublicUrl && (!authoredSlug || !String(repository.url).startsWith('https://github.com/'))) {
    evidenceFailure('repository-evidence/url-invalid', translateCliMessage('evidence.url-invalid'), {
      subject: { path: '/meta/repository/url' },
      evidence: { repositoryUrl: repository.url },
      supportedFixes: [translateCliMessage('evidence.fix.canonical-url')],
    });
  }
  if (!repoRootInput) {
    evidenceFailure('repository-evidence/root-required', translateCliMessage('evidence.root-required'), {
      subject: { path: '/meta/repository' },
      supportedFixes: [translateCliMessage('evidence.fix.pass-repo-root')],
    });
  }

  const requestedRoot = path.resolve(repoRootInput);
  let realRoot;
  try {
    realRoot = fs.realpathSync(requestedRoot);
  } catch (error) {
    evidenceFailure('repository-evidence/root-unreadable', translateCliMessage('evidence.root-unreadable', { root: requestedRoot, reason: error.message }), {
      subject: { repoRoot: requestedRoot },
      evidence: { reason: error.message },
      supportedFixes: [translateCliMessage('evidence.fix.readable-dir')],
    });
  }
  const gitRoot = gitValue(realRoot, ['rev-parse', '--show-toplevel'], translateCliMessage('evidence.root-not-git', { root: realRoot }));
  if (fs.realpathSync(gitRoot) !== realRoot) {
    evidenceFailure('repository-evidence/root-not-top-level', translateCliMessage('evidence.root-not-top-level', { gitRoot }), {
      subject: { repoRoot: realRoot },
      evidence: { gitTopLevel: gitRoot },
      supportedFixes: [translateCliMessage('evidence.fix.top-level', { gitRoot })],
    });
  }
  if (hasPublicUrl) {
    const origin = gitValue(realRoot, ['remote', 'get-url', 'origin'], translateCliMessage('evidence.origin-required'));
    if (githubSlug(origin) !== authoredSlug) {
      evidenceFailure('repository-evidence/origin-mismatch', translateCliMessage('evidence.origin-mismatch', { origin: JSON.stringify(origin), repository: JSON.stringify(repository.url) }), {
        subject: { repoRoot: realRoot },
        evidence: { localOrigin: origin, authoredRepository: repository.url },
        supportedFixes: [translateCliMessage('evidence.fix.matching-checkout')],
      });
    }
  }

  const revision = repository.revision.toLowerCase();
  const commit = runGit(realRoot, ['cat-file', '-e', `${revision}^{commit}`]);
  if (commit.status !== 0) {
    evidenceFailure('repository-evidence/revision-unavailable', translateCliMessage('evidence.revision-unavailable', { revision }), {
      subject: { repoRoot: realRoot },
      evidence: { revision },
      supportedFixes: [translateCliMessage('evidence.fix.fetch-commit')],
    });
  }

  const nodes = Object.create(null);
  let referenceCount = 0;
  const components = Array.isArray(diagram.components) ? diagram.components : [];
  for (const [componentIndex, component] of components.entries()) {
    if (!Array.isArray(component.sources) || component.sources.length === 0) continue;
    const verified = [];
    for (const [sourceIndex, authored] of component.sources.entries()) {
      const where = `/components/${componentIndex}/sources/${sourceIndex}/path`;
      const source = {
        path: verifiedSourcePath(authored.path, where),
        ...(authored.line ? { line: authored.line } : {}),
        ...(authored.end_line ? { endLine: authored.end_line } : {}),
        ...(authored.label ? { label: authored.label } : {}),
      };
      if (source.endLine && !source.line) {
        evidenceFailure('repository-evidence/line-required', translateCliMessage('evidence.line-required', { where: `/components/${componentIndex}/sources/${sourceIndex}/end_line` }), {
          subject: { path: `/components/${componentIndex}/sources/${sourceIndex}/end_line`, componentId: component.id },
          supportedFixes: [translateCliMessage('evidence.fix.line-or-end')],
        });
      }
      if (source.endLine && source.endLine < source.line) {
        evidenceFailure('repository-evidence/line-range-invalid', translateCliMessage('evidence.line-range-invalid', { where: `/components/${componentIndex}/sources/${sourceIndex}/end_line` }), {
          subject: { path: `/components/${componentIndex}/sources/${sourceIndex}`, componentId: component.id },
          evidence: { line: source.line, endLine: source.endLine },
          supportedFixes: [translateCliMessage('evidence.fix.end-line-order')],
        });
      }
      const object = `${revision}:${source.path}`;
      const type = runGit(realRoot, ['cat-file', '-t', object]);
      if (type.status !== 0 || type.stdout.trim() !== 'blob') {
        evidenceFailure('repository-evidence/file-missing', translateCliMessage('evidence.file-missing', { where, revision }), {
          subject: { path: where, componentId: component.id },
          evidence: { sourcePath: source.path, revision },
          supportedFixes: [translateCliMessage('evidence.fix.existing-path')],
        });
      }
      if (source.line) {
        const content = runGit(realRoot, ['show', object]);
        if (content.status !== 0) evidenceFailure('repository-evidence/file-unreadable', translateCliMessage('evidence.file-unreadable', { where, revision }), {
          subject: { path: where, componentId: component.id },
          evidence: { sourcePath: source.path, revision },
          supportedFixes: [translateCliMessage('evidence.fix.readable-blob')],
        });
        const lineCount = sourceLineCount(content.stdout);
        const requestedLine = source.endLine || source.line;
        if (requestedLine > lineCount) {
          evidenceFailure('repository-evidence/line-out-of-range', translateCliMessage('evidence.line-out-of-range', { where: `/components/${componentIndex}/sources/${sourceIndex}`, requestedLine, path: source.path, lineCount, revision }), {
            subject: { path: `/components/${componentIndex}/sources/${sourceIndex}`, componentId: component.id },
            evidence: { sourcePath: source.path, requestedLine, lineCount, revision },
            supportedFixes: [translateCliMessage('evidence.fix.existing-range')],
          });
        }
      }
      verified.push(hasPublicUrl ? { ...source, href: sourceHref(canonicalUrl, revision, source) } : { ...source });
      referenceCount += 1;
    }
    nodes[component.id] = verified;
  }
  if (referenceCount === 0) {
    evidenceFailure('repository-evidence/source-required', translateCliMessage('evidence.source-required'), {
      subject: { path: '/meta/repository' },
      supportedFixes: [translateCliMessage('evidence.fix.one-source')],
    });
  }

  return {
    schemaVersion: 1,
    verified: true,
    repository: {
      ...(hasPublicUrl ? { url: canonicalUrl } : {}),
      revision,
      shortRevision: revision.slice(0, 7),
    },
    referenceCount,
    nodes,
  };
}
