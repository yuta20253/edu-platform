# frozen_string_literal: true

# Admin::AnalyticsQuery の正答率ワーストランキング（単元・設問）を切り出したモジュール。
# includeするクラスは question_histories_scope(from_date, to_date) と
# from/to、MIN_ANSWER_COUNT・RANKING_LIMIT・QUESTION_TEXT_TRUNCATE_LENGTH 定数を持つこと。
module AnalyticsRankable
  def low_accuracy_units
    unit_ranking_rows.map { |row| build_unit_ranking(row) }
  end

  def low_accuracy_questions
    question_ranking_rows.map { |row| build_question_ranking(row) }
  end

  private

  def build_unit_ranking(row)
    unit_id, unit_name, course_id, course_name, subject_name, answer_count, correct_count = row

    {
      unit_id: unit_id,
      unit_name: unit_name,
      course_id: course_id,
      course_name: course_name,
      subject_name: subject_name,
      answer_count: answer_count,
      accuracy_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(correct_count, answer_count)
    }
  end

  def build_question_ranking(row)
    question_id, question_text, unit_id, unit_name, course_id, answer_count, correct_count = row

    {
      question_id: question_id,
      question_text: question_text.to_s[0, self.class::QUESTION_TEXT_TRUNCATE_LENGTH],
      unit_id: unit_id,
      unit_name: unit_name,
      course_id: course_id,
      answer_count: answer_count,
      accuracy_rate: ::Student::Analytics::Calculator.correct_rate_from_counts(correct_count, answer_count)
    }
  end

  def unit_ranking_rows
    question_histories_scope(from, to)
      .joins(:unit, :course)
      .joins('INNER JOIN subjects ON subjects.id = courses.subject_id')
      .merge(Unit.active)
      .merge(Course.active)
      .group(
        Arel.sql('question_histories.unit_id'), Arel.sql('units.unit_name'),
        Arel.sql('question_histories.course_id'), Arel.sql('courses.level_name'), Arel.sql('subjects.name')
      )
      .having('COUNT(*) >= ?', self.class::MIN_ANSWER_COUNT)
      .order(Arel.sql("#{accuracy_ratio_sql} ASC"), Arel.sql('question_histories.unit_id ASC'))
      .limit(self.class::RANKING_LIMIT)
      .pluck(
        Arel.sql('question_histories.unit_id'),
        Arel.sql('units.unit_name'),
        Arel.sql('question_histories.course_id'),
        Arel.sql('courses.level_name'),
        Arel.sql('subjects.name'),
        Arel.sql('COUNT(*)'),
        Arel.sql('SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END)')
      )
  end

  def question_ranking_rows
    question_histories_scope(from, to)
      .joins(:question, :unit, :course)
      .merge(Question.active)
      .merge(Unit.active)
      .merge(Course.active)
      .group(
        Arel.sql('question_histories.question_id'), Arel.sql('questions.question_text'),
        Arel.sql('question_histories.unit_id'), Arel.sql('units.unit_name'),
        Arel.sql('question_histories.course_id')
      )
      .having('COUNT(*) >= ?', self.class::MIN_ANSWER_COUNT)
      .order(Arel.sql("#{accuracy_ratio_sql} ASC"), Arel.sql('question_histories.question_id ASC'))
      .limit(self.class::RANKING_LIMIT)
      .pluck(
        Arel.sql('question_histories.question_id'),
        Arel.sql('questions.question_text'),
        Arel.sql('question_histories.unit_id'),
        Arel.sql('units.unit_name'),
        Arel.sql('question_histories.course_id'),
        Arel.sql('COUNT(*)'),
        Arel.sql('SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END)')
      )
  end

  def accuracy_ratio_sql
    '(SUM(CASE WHEN question_histories.is_correct THEN 1 ELSE 0 END) / COUNT(*))'
  end
end
