class CreateTeacherSchoolClasses < ActiveRecord::Migration[7.2]
  def change
    create_table :teacher_school_classes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :school_class, null: false, foreign_key: true
      t.integer :role, null: false

      t.timestamps
    end

    add_index :teacher_school_classes, [:user_id, :school_class_id], unique: true
    add_index :teacher_school_classes, :school_class_id, unique: true, where: "role = 0", name: "index_teacher_school_classes_on_school_class_id_homeroom"
  end
end
