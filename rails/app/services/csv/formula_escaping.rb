module Csv::FormulaEscaping
  BOM = "\uFEFF"
  FORMULA_PREFIXES = ['=', '+', '-', '@'].freeze

  def escape_formula(value)
    return value unless value.is_a?(String)
    return value unless value.start_with?(*FORMULA_PREFIXES)

    "'#{value}"
  end
end
