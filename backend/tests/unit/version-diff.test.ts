import { diffContent } from '../../src/modules/contract-versions/version.diff.util';

describe('diffContent', () => {
  it('detects changed, added, and removed top-level fields', () => {
    const before = { title: 'Old Title', value: 100, removedField: 'gone' };
    const after = { title: 'New Title', value: 100, addedField: 'new' };

    const diffs = diffContent(before, after);
    const fields = diffs.map((d) => d.field).sort();

    expect(fields).toEqual(['addedField', 'removedField', 'title']);
  });

  it('returns no diffs for identical content', () => {
    const content = { a: 1, b: 'x' };
    expect(diffContent(content, content)).toEqual([]);
  });

  it('treats a null "before" (first version) as all-added fields', () => {
    const diffs = diffContent(null, { a: 1 });
    expect(diffs).toEqual([{ field: 'a', before: null, after: 1 }]);
  });
});
