class Teacher::StudentTaskUnitSerializer < UnitSerializer
  attributes :total_questions, :answered_count, :correct_count, :progress_rate, :correct_rate

  def total_questions
    progress[:total_questions]
  end

  def answered_count
    progress[:answered_count]
  end

  def correct_count
    progress[:correct_count]
  end

  def progress_rate
    progress[:progress_rate]
  end

  def correct_rate
    progress[:correct_rate]
  end

  private

  def progress
    instance_options[:progress]
  end
end
