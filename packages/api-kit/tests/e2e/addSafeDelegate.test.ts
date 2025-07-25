import { Address, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import SafeApiKit, { AddSafeDelegateProps } from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const PRIVATE_KEY_2 = '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'

let safeApiKit: SafeApiKit
let signer: AddSafeDelegateProps['signer']
let delegatorAddress: Address

describe('addSafeDelegate', () => {
  before(() => {
    safeApiKit = getApiKit()
    signer = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY_1)
    })
    delegatorAddress = signer.account.address
  })

  it('should fail if Label is empty', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: ''
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid label')
  })

  it('should fail if Safe delegate address is empty', async () => {
    const delegateAddress = ''
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegate address')
  })

  it('should fail if Safe delegator address is empty', async () => {
    const delegateAddress = '0xe4bb611E4e4164D54Ad7361B9d58b0A1eBD462B8'
    const delegatorAddress = ''
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith('Invalid Safe delegator address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = API_TESTING_SAFE.address.toLowerCase()
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${safeAddress} is not checksumed`)
  })

  it('should fail if Safe delegate address is not checksummed', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'.toLowerCase()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegateAddress} is not checksumed`)
  })

  it('should fail if Safe delegator address is not checksummed', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegatorAddressLowerCase = delegatorAddress.toLowerCase()
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress: delegatorAddressLowerCase,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Address ${delegatorAddressLowerCase} is not checksumed`)
  })

  it('should fail if Safe does not exist', async () => {
    const safeAddress = '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(`Safe=${safeAddress} does not exist or it's still not indexed`)
  })

  it('should fail if the signer is not an owner of the Safe', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const nonOwnerSigner = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: privateKeyToAccount(PRIVATE_KEY_2)
    })
    const delegatorAddress = nonOwnerSigner.account.address
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer: nonOwnerSigner,
      label: 'Label'
    }
    await chai
      .expect(safeApiKit.addSafeDelegate(delegateConfig))
      .to.be.rejectedWith(
        `Provided delegator=${delegatorAddress} is not an owner of Safe=${safeAddress}`
      )
  })

  it('should add a new delegate', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({ safeAddress })
    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe).to.be.equal(delegateConfig.safeAddress)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateConfig.delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegateConfig.delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({ safeAddress })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate without specifying a Safe', async () => {
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const delegateConfig: AddSafeDelegateProps = {
      delegateAddress,
      delegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateConfig.delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegateConfig.delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      delegateAddress,
      delegatorAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })

  it('should add a new delegate EIP-3770', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const delegateAddress = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'
    const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
    const eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    const delegateConfig: AddSafeDelegateProps = {
      safeAddress: eip3770SafeAddress,
      delegateAddress: eip3770DelegateAddress,
      delegatorAddress: eip3770DelegatorAddress,
      signer,
      label: 'Label'
    }
    const { results: initialDelegates } = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    chai.expect(initialDelegates.length).to.be.eq(0)
    const delegateResponse = await safeApiKit.addSafeDelegate(delegateConfig)
    chai.expect(delegateResponse.safe).to.be.equal(safeAddress)
    chai.expect(delegateResponse.delegate).to.be.equal(delegateAddress)
    chai.expect(delegateResponse.delegator).to.be.equal(delegatorAddress)
    chai.expect(delegateResponse.signature).to.be.a('string')
    chai.expect(delegateResponse.label).to.be.equal(delegateConfig.label)
    const { results: finalDelegates } = await safeApiKit.getSafeDelegates({
      safeAddress: eip3770SafeAddress
    })
    chai.expect(finalDelegates.length).to.be.eq(1)
    await safeApiKit.removeSafeDelegate(delegateConfig)
  })
})
