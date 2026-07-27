class CreateSchoolClasses < ActiveRecord::Migration[7.1]
  def change
    create_table :school_classes do |t|
      t.references :grade, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end
  end
end
