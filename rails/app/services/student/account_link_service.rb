class Student::AccountLinkService
  class AlreadyLinkedError < StandardError; end
  class AlreadyActivatedError < StandardError; end
  class HasDependentDataError < StandardError; end

  def initialize(user:, student_number:)
    @user = user
    @student_number = student_number
  end

  def call
    find_user!

    ActiveRecord::Base.transaction do
      high_school_id = @target_user.high_school_id
      grade_id = @target_user.grade_id
      school_class_id = @target_user.school_class_id
      student_number = @target_user.student_number
      merged_user_id = @target_user.id

      @target_user.destroy!

      @user.update!(
        high_school_id: high_school_id,
        grade_id: grade_id,
        school_class_id: school_class_id,
        student_number: student_number
      )

      AccountLinkAudit.create!(
        user: @user,
        merged_user_id: merged_user_id,
        student_number: student_number,
        high_school_id: high_school_id,
        grade_id: grade_id,
        school_class_id: school_class_id,
        result: :success,
      )
    end
  end

  private

  def find_user!
    @target_user = User.active.find_by!(student_number: @student_number)

    raise AlreadyLinkedError, '既に紐付けられています' if @target_user == @user
    raise AlreadyActivatedError, '既に利用されているアカウントです' unless @target_user.password_reset_required
    raise HasDependentDataError, '統合できません' if dependent_data_exists?
  end

  def dependent_data_exists?
    @target_user.study_logs.exists? ||
      @target_user.question_histories.exists? ||
      @target_user.goals.exists? ||
      @target_user.draft_tasks.exists? ||
      @target_user.tasks.exists?
  end
end
