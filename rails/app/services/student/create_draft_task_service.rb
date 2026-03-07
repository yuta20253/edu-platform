# frozen_string_literal: true

module Student
  class CreateDraftTaskService
    def initialize(form)
      @form = form
    end

    def call
      ActiveRecord::Base.transaction do
        draft_task = DraftTask.create!(
          user: @form.current_user,
          goal: @form.goal,
          title: @form.title,
          content: @form.content,
          priority: @form.priority,
          due_date: @form.parsed_due_date,
          estimated_time: 0,
          memo: @form.memo
        )

        units = Unit.where(id: @form.unit_ids)
        draft_task.units << units

        draft_task.id
      end
    end
  end
end
