import { t } from 'elysia'

/** 单位完整信息 */
export const Unit = t.Object({
  id: t.String({ description: '单位 ID' }),
  name: t.String({ description: '单位名称（全称）' }),
  shortName: t.String({ description: '单位简称' }),
  parentId: t.Union([t.String(), t.Null()], { description: '父级单位 ID，null 表示顶级单位' }),
  status: t.Boolean({ description: '状态：true-启用，false-停用' }),
  remark: t.Union([t.String(), t.Null()], { description: '备注' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间，null 表示未删除' }),
})

/** 单位树节点（递归结构） */
export const UnitTreeNode = t.Recursive(Self =>
  t.Object({
    id: t.String({ description: '单位 ID' }),
    name: t.String({ description: '单位名称（全称）' }),
    shortName: t.String({ description: '单位简称' }),
    parentId: t.Union([t.String(), t.Null()], { description: '父级单位 ID' }),
    status: t.Boolean({ description: '状态' }),
    remark: t.Union([t.String(), t.Null()], { description: '备注' }),
    createdAt: t.Date({ description: '创建时间' }),
    updatedAt: t.Date({ description: '更新时间' }),
    deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
    children: t.Array(Self, { description: '子单位列表' }),
  }),
)

/** 创建单位请求体 */
export const CreateUnit = t.Object({
  name: t.String({ minLength: 1, maxLength: 100, description: '单位名称（全称），最长100字' }),
  shortName: t.String({ minLength: 1, maxLength: 50, description: '单位简称，最长50字' }),
  parentId: t.Optional(t.String({ description: '父级单位 ID，不传则为顶级单位' })),
  status: t.Optional(t.Boolean({ description: '状态，默认启用' })),
  remark: t.Optional(t.String({ maxLength: 500, description: '备注，最长500字' })),
})

/** 更新单位请求体 */
export const UpdateUnit = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100, description: '单位名称（全称）' })),
  shortName: t.Optional(t.String({ minLength: 1, maxLength: 50, description: '单位简称' })),
  parentId: t.Optional(t.Union([t.String(), t.Null()], { description: '父级单位 ID，传 null 可移至顶级' })),
  status: t.Optional(t.Boolean({ description: '状态' })),
  remark: t.Optional(t.String({ maxLength: 500, description: '备注' })),
})

/** 错误响应 */
export const UnitError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type UnitType = typeof Unit.static
export type CreateUnitType = typeof CreateUnit.static
export type UpdateUnitType = typeof UpdateUnit.static
