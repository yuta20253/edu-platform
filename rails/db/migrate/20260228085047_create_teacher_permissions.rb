class CreateTeacherPermissions < ActiveRecord::Migration[7.1]
  def change
    create_table :teacher_permissions do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.integer :grade_scope
      t.boolean :manage_other_teachers

      t.timestamps
    end
  end
end
