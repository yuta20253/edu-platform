# frozen_string_literal: true

module Student
  class UpdateTaskService
    def initialize(form)
      @form = form
    end

    def call
      task = @form.task
      ActiveRecord::Base.transaction do
        update_task(task)
        sync_units(task)
      end
      true
    rescue ActiveRecord::RecordInvalid => e
      @form.errors.add(:base, e.message)
      false
    end

    private

    def update_task(task)
      task.update!(
        title: @form.title,
        content: @form.content,
        priority: @form.priority,
        due_date: @form.parsed_due_date,
        memo: @form.memo
      )
    end

    def sync_units(task)
      return unless @form.unit_ids_provided

      current_unit_ids = task.task_units.pluck(:unit_id)

      new_unit_ids = @form.unit_ids

      add_unit_ids = new_unit_ids - current_unit_ids

      remove_unit_ids = current_unit_ids - new_unit_ids

      if add_unit_ids.any?
        task.task_units.insert_all!(
          add_unit_ids.map { |id| { task_id: task.id, unit_id: id } }
        )
      end

      task.task_units.where(unit_id: remove_unit_ids).delete_all
    end
  end
end
