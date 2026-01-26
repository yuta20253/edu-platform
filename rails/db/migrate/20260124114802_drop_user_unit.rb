class DropUserUnit < ActiveRecord::Migration[7.1]
  def change
    drop_table :user_units, if_exists: true
  end
end
