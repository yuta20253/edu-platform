class Teacher::ImportHistoryCsvExporterService
  require 'csv'

  BOM = "\uFEFF"
  FORMULA_PREFIXES = ['=', '+', '-', '@'].freeze

  def initialize(history)
    @history = history
  end

  def call
    csv = CSV.generate do |c|
      c << %w[氏名 氏名カナ 学年 学級 生徒コード]

      @history.imported_students.each do |imported_student|
        c << [
          escape_formula(imported_student.user.name),
          escape_formula(imported_student.user.name_kana),
          escape_formula(imported_student.user.grade&.display_name),
          escape_formula(imported_student.user.school_class.name),
          imported_student.user.student_number
        ]
      end
    end

    "#{BOM}#{csv}"
  end

  private

  def escape_formula(value)
    return value unless value.is_a?(String)
    return value unless value.start_with?(*FORMULA_PREFIXES)

    "'#{value}"
  end
end
