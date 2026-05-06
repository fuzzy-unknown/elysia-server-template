import { db } from '../db'
import { createUnitRouter } from './unit'
import { createUserRouter } from './user'

export const unitModule = createUnitRouter(db)
export const userModule = createUserRouter(db)
