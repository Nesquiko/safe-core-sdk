import { Address, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import SafeApiKit, {
  DeleteSafeDelegateProps,
  SafeDelegateResponse
} from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

const PRIVATE_KEY = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

let safeApiKit: SafeApiKit
let signer: DeleteSafeDelegateProps['signer']
let delegatorAddress: Address

describe('getSafeDelegates', () => {
  const safeAddress = API_TESTING_SAFE.address

  before(() => {
    safeApiKit = getApiKit()
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY)
    })
    delegatorAddress = signer.account.address
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeDelegates({ safeAddress }))
      .to.be.rejectedWith('Bad Request')
  })

  it('should fail if Safe address is not checksummed', async () => {
    await chai
      .expect(safeApiKit.getSafeDelegates({ safeAddress: safeAddress.toLowerCase() }))
      .to.be.rejectedWith('Enter a valid checksummed Ethereum Address')
  })

  it('should return an empty array if the Safe address is not found', async () => {
    const safeAddress = '0x11dBF28A2B46bdD4E284e79e28B2E8b94Cfa39Bc'
    const safeDelegateListResponse = await safeApiKit.getSafeDelegates({ safeAddress })
    const results = safeDelegateListResponse.results
    chai.expect(results).to.be.empty
  })

  describe('for valid parameters', () => {
    let delegateConfig1: DeleteSafeDelegateProps
    let delegateConfig2: DeleteSafeDelegateProps
    let delegatesResponse: SafeDelegateResponse[]

    before(async () => {
      delegateConfig1 = {
        delegateAddress: '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
        delegatorAddress,
        signer
      }
      delegateConfig2 = {
        delegateAddress: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        delegatorAddress,
        signer
      }

      await safeApiKit.addSafeDelegate({
        safeAddress,
        label: 'Label1',
        ...delegateConfig1
      })
      await safeApiKit.addSafeDelegate({
        safeAddress,
        label: 'Label2',
        ...delegateConfig2
      })
    })

    after(async () => {
      await safeApiKit.removeSafeDelegate({
        delegateAddress: delegateConfig1.delegateAddress,
        delegatorAddress,
        signer
      })
      await safeApiKit.removeSafeDelegate({
        delegateAddress: delegateConfig2.delegateAddress,
        delegatorAddress,
        signer
      })
    })

    it('should return an array of delegates', async () => {
      const { results, count } = await safeApiKit.getSafeDelegates({ safeAddress })
      delegatesResponse = [...results]
      results.sort((a: SafeDelegateResponse, b: SafeDelegateResponse) =>
        a.delegate > b.delegate ? -1 : 1
      )
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(2)
      chai.expect(results[0].safe).to.be.eq(safeAddress)
      chai.expect(results[0].delegate).to.be.eq(delegateConfig1.delegateAddress)
      chai.expect(results[0].delegator).to.be.eq(delegateConfig1.signer.account!.address)
      chai.expect(results[0].label).to.be.eq('Label1')
      chai.expect(results[1].safe).to.be.eq(safeAddress)
      chai.expect(results[1].delegate).to.be.eq(delegateConfig2.delegateAddress)
      chai.expect(results[1].delegator).to.be.eq(delegateConfig2.signer.account!.address)
      chai.expect(results[1].label).to.be.eq('Label2')
    })

    it('should return only the first delegate with limit = 1', async () => {
      const { results, count } = await safeApiKit.getSafeDelegates({ safeAddress, limit: 1 })
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(1)
      chai.expect(results).to.be.deep.eq(delegatesResponse.slice(0, 1))
    })

    it('should return only the second delegate with offset = 1', async () => {
      const { results, count } = await safeApiKit.getSafeDelegates({ safeAddress, offset: 1 })
      chai.expect(count).to.be.eq(2)
      chai.expect(results.length).to.be.eq(1)
      chai.expect(results).to.be.deep.eq(delegatesResponse.slice(1))
    })
  })

  it('should return an array of delegates EIP-3770', async () => {
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateConfig1: DeleteSafeDelegateProps = {
      delegateAddress: `${config.EIP_3770_PREFIX}:0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B`,
      delegatorAddress,
      signer
    }
    const delegateConfig2: DeleteSafeDelegateProps = {
      delegateAddress: `${config.EIP_3770_PREFIX}:0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`,
      delegatorAddress,
      signer
    }
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label1',
      ...delegateConfig1
    })
    await safeApiKit.addSafeDelegate({
      safeAddress,
      label: 'Label2',
      ...delegateConfig2
    })
    const safeDelegateListResponse = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    const { results } = safeDelegateListResponse
    results.sort((a: SafeDelegateResponse, b: SafeDelegateResponse) =>
      a.delegate > b.delegate ? -1 : 1
    )
    chai.expect(results.length).to.be.eq(2)
    chai.expect(results[0].delegate).to.be.eq('0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B')
    chai.expect(results[0].delegator).to.be.eq(delegateConfig1.signer.account!.address)
    chai.expect(results[0].label).to.be.eq('Label1')
    chai.expect(results[1].delegate).to.be.eq('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b')
    chai.expect(results[1].delegator).to.be.eq(delegateConfig2.signer.account!.address)
    chai.expect(results[1].label).to.be.eq('Label2')
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig1.delegateAddress,
      delegatorAddress,
      signer
    })
    await safeApiKit.removeSafeDelegate({
      delegateAddress: delegateConfig2.delegateAddress,
      delegatorAddress,
      signer
    })
  })
})
