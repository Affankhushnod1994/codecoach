import { join } from 'path';
import slash from 'slash';

import { Log } from '../Logger';
import { getRelativePath } from './utils/path.util';
import { Parser } from './@interfaces/parser.interface';
import { LintItem } from './@types';
import { mapSeverity } from './utils/dotnetSeverityMap';
import { splitByLine } from './utils/lineBreak.util';
import { ProjectType } from '../Config/@enums';
import { NoNaN } from './utils/number.util';

export class MSBuildParser extends Parser {
  parse(content: string): LintItem[] {
    return splitByLine(content)
      .map((log) => this.toLintItem(log))
      .filter((log) => log);
  }

  private toLintItem(log: string): LintItem {
    const structureMatch = log.match(
      /^([\\/\w\d.:_ ()-]+)(?:\((\d+),(\d+)\))? ?: (\w+) (\w+): ([^\[]+)(?:\[(.+)])?$/,
    );
    if (!structureMatch) {
      const message = "MSBuildParser Error: log structure doesn't match";
      Log.error(message, { log });
      throw new Error(message);
    }

    const [
      ,
      _filepath,
      _line,
      _lineOffset,
      severityText,
      code,
      content,
      _csprojFullPath,
    ] = structureMatch;

    const fileFullPath =
      _csprojFullPath && _filepath
        ? slash(join(slash(_csprojFullPath), '..', slash(_filepath)))
        : '';
    const fileRelativePath = getRelativePath(this.cwd, fileFullPath);

    return {
      ruleId: code,
      log,
      line: NoNaN(_line),
      lineOffset: NoNaN(_lineOffset),
      msg: `${code.trim()}: ${content.trim()}`,
      source: fileRelativePath ?? fileFullPath,
      severity: mapSeverity(severityText),
      valid: fileRelativePath !== null,
      type: ProjectType.msbuild,
    };
  }
}
