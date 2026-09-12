import { renderTemplate, RenderTemplateInput } from '../../src/modules/templates/template-render.util';
import { AppError } from '../../src/core/errors/AppError';

function baseInput(overrides: Partial<RenderTemplateInput> = {}): RenderTemplateInput {
  return {
    templateName: 'Vendor Agreement',
    sections: [
      {
        title: 'Payment Terms',
        order: 1,
        clauses: [{ title: 'Payment', text: 'Vendor shall be paid {{amount}} within 30 days.' }],
      },
    ],
    variables: [{ name: 'amount', label: 'Payment Amount', type: 'number', required: true }],
    variableValues: { amount: 5000 },
    ...overrides,
  };
}

describe('renderTemplate', () => {
  it('substitutes a declared placeholder with its supplied value', () => {
    const result = renderTemplate(baseInput());

    expect(result['1. Payment Terms']).toBe('Vendor shall be paid 5000 within 30 days.');
    expect(result['Variable: Payment Amount']).toBe(5000);
  });

  it('renders multiple sections in order, each as its own flat key', () => {
    const result = renderTemplate(
      baseInput({
        sections: [
          { title: 'Termination', order: 2, clauses: [{ title: 'T', text: 'Either party may terminate.' }] },
          {
            title: 'Payment Terms',
            order: 1,
            clauses: [{ title: 'Payment', text: 'Pay {{amount}}.' }],
          },
        ],
      })
    );

    expect(Object.keys(result)).toEqual(['1. Payment Terms', '2. Termination', 'Variable: Payment Amount']);
    expect(result['2. Termination']).toBe('Either party may terminate.');
  });

  it('joins multiple clauses within one section with a blank line', () => {
    const result = renderTemplate(
      baseInput({
        sections: [
          {
            title: 'Payment Terms',
            order: 1,
            clauses: [
              { title: 'A', text: 'Clause A text.' },
              { title: 'B', text: 'Clause B text.' },
            ],
          },
        ],
      })
    );

    expect(result['1. Payment Terms']).toBe('Clause A text.\n\nClause B text.');
  });

  it('throws for a missing required variable, naming it', () => {
    const input = baseInput({ variableValues: {} });
    expect(() => renderTemplate(input)).toThrow(AppError);
    expect(() => renderTemplate(input)).toThrow(/Payment Amount/);
  });

  it('omits the variable entry and substitutes blank for a missing OPTIONAL variable', () => {
    const result = renderTemplate(
      baseInput({
        variables: [{ name: 'amount', label: 'Payment Amount', type: 'number', required: false }],
        variableValues: {},
      })
    );

    expect(result['1. Payment Terms']).toBe('Vendor shall be paid  within 30 days.');
    expect(result['Variable: Payment Amount']).toBeUndefined();
  });

  it.each([
    ['text', 'amount', 123],
    ['number', 'amount', 'not-a-number'],
    ['boolean', 'amount', 'yes'],
    ['date', 'amount', 'not-a-date'],
  ])('throws for a %s variable given a value of the wrong type', (type, name, badValue) => {
    const input = baseInput({
      variables: [{ name, label: 'Amount', type: type as never, required: true }],
      variableValues: { [name]: badValue },
    });
    expect(() => renderTemplate(input)).toThrow(AppError);
  });

  it('accepts a valid date-string variable', () => {
    const result = renderTemplate(
      baseInput({
        sections: [{ title: 'Dates', order: 1, clauses: [{ title: 'D', text: 'Effective on {{startDate}}.' }] }],
        variables: [{ name: 'startDate', label: 'Start Date', type: 'date', required: true }],
        variableValues: { startDate: '2026-01-01' },
      })
    );

    expect(result['1. Dates']).toBe('Effective on 2026-01-01.');
  });

  it('throws for a clause placeholder that references an undeclared variable', () => {
    const input = baseInput({
      sections: [
        {
          title: 'Payment Terms',
          order: 1,
          clauses: [{ title: 'Payment', text: 'Pay {{amount}} to {{undeclaredVar}}.' }],
        },
      ],
    });

    expect(() => renderTemplate(input)).toThrow(AppError);
    expect(() => renderTemplate(input)).toThrow(/undeclaredVar/);
  });

  it('does not require every declared variable to actually be used in a clause', () => {
    
    
    
    const result = renderTemplate(
      baseInput({
        variables: [
          { name: 'amount', label: 'Payment Amount', type: 'number', required: true },
          { name: 'unusedNote', label: 'Internal Note', type: 'text', required: false },
        ],
        variableValues: { amount: 5000, unusedNote: 'fyi' },
      })
    );

    expect(result['Variable: Internal Note']).toBe('fyi');
  });
});
