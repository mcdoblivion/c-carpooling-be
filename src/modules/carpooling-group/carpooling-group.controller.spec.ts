import { Test, TestingModule } from '@nestjs/testing'
import { CarpoolingGroupController } from './carpooling-group.controller'
import { CarpoolingGroupService } from './carpooling-group.service'
import { UserFromRequest } from './../../helpers/get-user-from-request.decorator'
import { FindCarpoolingGroupDto } from './dto/find-carpooling-group.dto'
import { CarpoolingGroupEntity, UserEntity } from 'src/typeorm/entities'
import { SearchDto } from 'src/helpers/search.dto'
import { SearchResult } from 'src/types'

describe('TestController', () => {
  let controller: CarpoolingGroupController
  const mockCarpoolingGroupService = {
    findCarpoolingGroups: jest
      .fn()
      .mockImplementation(
        async (
          { departureTime, comebackTime }: FindCarpoolingGroupDto,
          userId: number,
        ) => ({
          carpoolingGroups: [1, 2],
          total: 100,
        }),
      ),

    searchCarpoolingGroups: async (searchDto: SearchDto) => ({
      ...searchDto,
      records: new Array<CarpoolingGroupEntity>(2),
      page: 1,
      limit: 10,
      search: null,
      filters: null,
      sort: null,
      order: 'DESC',
      total: 100,
      totalPages: 10,
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarpoolingGroupController],
      providers: [CarpoolingGroupService],
    })
      .overrideProvider(CarpoolingGroupService)
      .useValue(mockCarpoolingGroupService)
      .overrideProvider(UserFromRequest)
      .useClass(UserFromRequest)
      .compile()

    controller = module.get<CarpoolingGroupController>(
      CarpoolingGroupController,
    )
  })

  describe('Initial', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined()
    })
  })

  describe('findCarpoolingGroups', () => {
    const mockFindCarpoolingGroupDto: FindCarpoolingGroupDto = {
      departureTime: '08:30',
      comebackTime: '17:30',
    }

    it('should return an array of carpooling group and total groups found', async () => {
      const result = await controller.findCarpoolingGroups(
        mockFindCarpoolingGroupDto,
        {} as UserEntity,
      )

      expect(result).toEqual({
        carpoolingGroups: expect.any(Array),
        total: expect.any(Number),
      })
    })
  })

  describe('search', () => {
    const mockSearchDto: SearchDto = { search: '123', sort: '123' }

    it('should return a search result of carpooling group', async () => {
      const searchResult = await controller.search(mockSearchDto)

      expect(searchResult).toEqual({
        records: expect.any(Array),
        page: expect.any(Number),
        limit: expect.any(Number),
        search: expect.any(String),
        filters: expect.any(Object),
        sort: expect.any(String),
        order: expect.any(String),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      })

      expect(
        mockCarpoolingGroupService.searchCarpoolingGroups,
      ).toHaveBeenCalledWith(mockSearchDto)
    })
  })
})
