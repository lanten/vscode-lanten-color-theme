import * as React from 'react';
import {
	Text, View, ScrollView, TextInput, ListView, RefreshControl, Image, TouchableOpacity, InteractionManager, ActivityIndicator, Alert
} from 'react-native';
import { globalColor, globalStyle, globalText } from '../../styles/global';
import { fn, project, event, TouchButton } from '../../components/fn';
import NavBar from '../../components/NavBar';
import { Actions } from 'react-native-router-flux';

import Icon from 'react-native-vector-icons/Ionicons';
import Awesome from 'react-native-vector-icons/FontAwesome';
import Switch from 'react-native-switch-pro';
import ImagePicker from 'react-native-image-crop-picker';
import Picker from 'react-native-picker';
import Modal from 'react-native-modalbox';


class Main extends React.Component {
	constructor(props, context) {
		super(props, context);
		this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
		let date = new Date();
		let selected = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
		this.state = {
			imageJson: [],
			newImageJson: [],
			extVals: {},
			remindflg: true,
			searchTitle: '',
			modalJson: ['loading'],
			isRefreshing_Modal: false,
			isUploading: false,
			lssuidateSelect: [selected[0] + '年', (selected[1] - 0) < 10 ? `0${selected[1] - 0}月` : selected[1] + '月', (selected[2] - 0) < 10 ? `0${selected[2] - 0}日` : selected[2] + '日'],
			scopeCheckJson: {},
		}
		let a = '123\,123\\123\-,123\!,1223\'123';
		this.stateText = this.props.certcd ? '编辑' : '保存';
		this.props.navigationState.title = '证照' + this.stateText;

		/**
		 * 照片选择组件 选项
		 */
		this.imgOpt = {
			title: '请选择',
			cancelButtonTitle: '取消',
			takePhotoButtonTitle: '拍照',
			chooseFromLibraryButtonTitle: '从相册选择照片',

			storageOptions: {
				skipBackup: true,
				path: 'images'
			}
		};
		JSON.stringify()
		this.init();

	}

	/**
	* 判断是否为编辑
	* 初始化带进来的证照数据
	*/
	init() {
		const { certcd } = this.props;
		if (certcd) {
			// 查询基本信息
			let sendData1 = {
				body: {
					"reqMap": { certcd },
					"callEntry": "proof_new.searchCertBycd",
					"dbName": "default",
					"namingId": "com.wx.masterData.certQueryNamingsql.select_certsBycd"
				},
				url: "com.wx.utils.publicMemer.component.queryNamedSqlMaptoEosMapbiz.biz.ext"
			};
			fn.searchData(sendData1, (result) => {
				this.certData = result.repMap[0];
				let { relasrevision, relascd, remindflg, companycd, catgcd, typecd, companyname, catgname, scopename, certscopecd, typename, lssuidate, certname, certno, lssuioffice, certterm, reminddays, remarks } = this.certData;

				// 初始化经营范围
				if (scopename) {
					certscopecd = certscopecd.split(",");
					relascd = relascd.split(",");
					relasrevision = relasrevision.split(",");
					this.scopeCheckJson = {}
					scopename.split(",").forEach((val, i) => {
						this.scopeCheckJson[`key_${certscopecd[i]}`] = {
							displayname: val,
							cd: certscopecd[i],
							relascd: relascd[i],
							relasrevision: [i],
							default: true,
							isChecked: 'default',
						};
					});
				} else {
					this.scopeCheckJson = {};
				}

				if (typecd) {
					this.getExt({ cd: typecd });
				}

				let obj = { remindflg: !!remindflg, scopeCheckJson: this.scopeCheckJson, companycd, catgcd, typecd, companyname, catgname, typename, lssuidate, certname, certno, lssuioffice, certterm, reminddays, remarks }

				// 初始化日期
				if (lssuidate) {
					let selected = lssuidate.split('-');
					let lssuidateSelect = [selected[0] + '年', (selected[1] - 0) < 10 ? `0${selected[1] - 0}月` : selected[1] + '月', (selected[2] - 0) < 10 ? `0${selected[2] - 0}日` : selected[2] + '日'];
					obj.lssuidateSelect = lssuidateSelect;
				}

				this.setState(obj);
			});

			// 获取证照图片列表
			let sendData2 = {
				body: {
					"reqMap": { certcd },
					"callEntry": "proof_new.searchCertImages",
					"dbName": "default",
					"namingId": "com.wx.masterData.certQueryNamingsql.select_certImages"
				},
				url: "com.wx.utils.publicMemer.component.queryNamedSqlMaptoEosMapbiz.biz.ext"
			};

			fn.searchData(sendData2, (result) => {
				let imageJson = result.repMap;
				this.setState({ imageJson });
			})
		}
	}

	render() {
		const {
			remindflg, imageJson, searchTitle, schkeyword, extJson, extVals, isUploading,
			companyname, catgname, typename, scopeCheckJson, lssuidate, certname, certno, lssuioffice, certterm, reminddays, remarks, lssuidateSelect
		 } = this.state;
		let scopeJson = []
		Object.values(scopeCheckJson).forEach(val => {
			if (val.isChecked) {
				scopeJson.push(val);
			}
		});
		return (
			<View style={globalStyle.container}>
				<ScrollView
					style={globalStyle.container}
				>

					<View style={css.imgBox}>
						<ScrollView horizontal style={{ flex: 1 }} >
							{(() => {
								let renderView = [];
								imageJson.forEach((val, i) => {
									let imgurl = fn.getImgUrl(val.imageurl);
									if (val._state != "DELETE") {
										renderView.push(
											<TouchButton style={css.imgBtn} key={i}>
												<Image source={{ uri: imgurl }} style={css.img} />
												<TouchableOpacity style={css.imgRemove} onPress={(() => {
													Alert.alert("操作", "确认删除图片吗？", [{
														text: "确定", onPress: () => {
															let imageJson2 = Object.assign([], imageJson);
															if (imageJson[i]._state == 'ADDED') {
																delete imageJson2[i];
															} else {
																imageJson2[i]._state = 'DELETE';
															}
															this.setState({ imageJson: imageJson2 });
														}
													}, { text: "取消" }]);
												})}>
													<Icon name="ios-close" style={css.imgRemoveIcon} />
												</TouchableOpacity>
											</TouchButton>
										)
									}
								})

								let addBtn = isUploading ? (
									<TouchButton style={css.imgBtn} key="uploading" disabled>
										<ActivityIndicator animating={true} size={32} color={globalColor.mainColor} />
										<Text style={{ color: globalColor.text3 }}>loading</Text>
									</TouchButton>
								) : (
										<TouchButton style={css.imgBtn} key="add" onPress={() => this.refs.modalImg.open()}>
											<Icon name="ios-add-circle-outline" size={44} color={globalColor.defaultColor} />
											<Text style={globalStyle.listText2}>拍照或上传</Text>
										</TouchButton>
									);
								renderView.unshift(addBtn)
								return renderView;
							})()}
						</ScrollView>
					</View>

					<View style={globalStyle.listGroup}>
						<TouchButton style={globalStyle.listBody}>
							<Text style={globalStyle.listLable}>证照名称</Text>
							<TextInput style={globalStyle.listInput} placeholder="请输入证照名称(必填)" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								onChangeText={(text) => {
									this.setState({ certname: text })
								}}
								value={certname} />
						</TouchButton>
						<TouchButton style={globalStyle.listBody}>
							<Text style={globalStyle.listLable}>证照编码</Text>
							<TextInput style={globalStyle.listInput} placeholder="请输入证照编码(必填)" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								onChangeText={(text) => {
									this.setState({ certno: text })
								}}
								value={certno} />
						</TouchButton>

						<TouchButton style={globalStyle.listBody} onPress={() => {
							this.keys = {
								displaykey: 'companyname',
								cdkey: 'companycd',
								pkg: 'com.wx.masterData.companyQueryNamingsql.select_companyCom',
							};
							this.searchModal('企业名称');
						}}>
							<Text style={globalStyle.listLable}>企业名称</Text>
							<Text style={globalStyle.listText}>{companyname || globalText.noSelect + '(必选)'}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
					</View>

					<View style={globalStyle.listGroup}>
						<TouchButton style={globalStyle.listBody} onPress={() => {
							this.keys = {
								displaykey: 'catgname',
								cdkey: 'catgcd',
								pkg: 'com.wx.masterData.companyQueryNamingsql.select_gorups',
								sendData: { grouptype: 3 },
							};
							this.searchModal('证照分类');
						}}>
							<Text style={globalStyle.listLable}>证照分类</Text>
							<Text style={globalStyle.listText}>{catgname || globalText.noSelect}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
						<TouchButton style={globalStyle.listBody} onPress={() => {
							this.keys = {
								displaykey: 'typename',
								cdkey: 'typecd',
								change: true,
								pkg: 'com.wx.masterData.companyQueryNamingsql.select_types',
								sendData: { typename: null, typegroup: 3 },
							};
							this.searchModal('证照类型');
						}}>
							<Text style={globalStyle.listLable}>证照类型</Text>
							<Text style={globalStyle.listText}>{typename || globalText.noSelect}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
						<TouchButton style={globalStyle.listBody} onPress={() => {
							this.keys = {
								select2: true,
								displaykey: 'scopename',
								cdkey: 'certscopecd',
								pkg: 'com.wx.masterData.certQueryNamingsql.select_scope',
							};
							this.searchModal('经营范围');
						}}>
							<Text style={globalStyle.listLable}>经营范围</Text>
							<Text style={globalStyle.listText}>{
								scopeJson.length ? (() => {
									let str = '';
									scopeJson.forEach((val, i) => {
										str += `${i > 0 ? ',' : ''}${val.displayname}`;
									})
									return str;
								})() : globalText.noSelect
							}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
					</View>

					{
						extJson && extJson.length &&
						<View style={globalStyle.listGroup}>
							{extJson.map((val, i) => <TouchButton style={globalStyle.listBody} key={i}>
								<Text style={globalStyle.listLable}>{val.displayname}</Text>
								<TextInput style={globalStyle.listInput} placeholder={`请输入${val.displayname}`} autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
									onChangeText={(text) => {
										extVals[`key_${val.extcd}`] = {
											text,
											rowData: val,
										};
										this.setState({ extVals });
									}}
									defaultValue={val.extvalue} />
							</TouchButton>)}
						</View>
					}

					<View style={globalStyle.listGroup}>
						<TouchButton style={globalStyle.listBody}>
							<Text style={globalStyle.listLable}>发证机关</Text>
							<TextInput style={globalStyle.listInput} placeholder="请输入发证机关" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								onChangeText={(text) => {
									this.setState({ lssuioffice: text });
								}}
								value={lssuioffice} />
						</TouchButton>
						<TouchButton style={globalStyle.listBody} onPress={() => {
							Picker.init({
								pickerData: fn._createDateData(),
								pickerToolBarFontSize: 14,
								pickerCancelBtnText: '取消',
								pickerConfirmBtnText: '选择',
								pickerTitleText: '请选择日期',
								selectedValue: lssuidateSelect,
								onPickerConfirm: (val, i) => {
									let lssuidate = val[0].substring(0, val[0].length - 1) + '-' + val[1].substring(0, val[1].length - 1) + '-' + val[2].substring(0, val[2].length - 1);
									this.setState({ lssuidate });
								},
							});
							Picker.show();
						}}>
							<Text style={globalStyle.listLable}>发证日期</Text>
							<Text style={globalStyle.listText}>{lssuidate || globalText.noSelect}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
						<TouchButton style={globalStyle.listBody}>
							<Text style={globalStyle.listLable}>证照期限</Text>
							<TextInput style={[globalStyle.listInput, { flex: 1 }]} placeholder="请输入证照期限" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								onChangeText={(text) => {
									this.setState({ certterm: text });
								}}
								value={certterm} />
							<Text style={[globalStyle.listText2, { fontSize: 14 }]}>月</Text>
						</TouchButton>
						<TouchButton style={globalStyle.listBody} disabled={!remindflg}>
							<Text style={globalStyle.listLable}>到期提醒</Text>
							<TextInput style={[globalStyle.listInput, { color: remindflg ? globalColor.text2 : globalColor.defaultColor }]} placeholder="请输入到期提醒时间" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								editable={remindflg}
								onChangeText={(text) => {
									this.setState({ reminddays: text });
								}}
								value={reminddays} />
							<Text style={{ marginRight: 10, color: remindflg ? globalColor.text2 : globalColor.defaultColor }}>天</Text>
							<Switch onSyncPress={remindflg => {
								this.setState({ remindflg });
							}}
								value={remindflg}
							/>
						</TouchButton>
						<TouchButton style={globalStyle.listBody}>
							<Text style={globalStyle.listLable}>添加备注</Text>
							<TextInput style={globalStyle.listInput} placeholder="备注" autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
								onChangeText={(text) => {
									this.setState({ remarks: text });
								}}
								value={remarks} />
						</TouchButton>
					</View>

					<TouchButton style={globalStyle.listSubmitBtn} onPress={() => {
						let { remindflg, scopeCheckJson, companycd, catgcd, typecd, lssuidate, certname, certno, lssuioffice, certterm, reminddays, remarks, extVals } = this.state;
						remindflg = remindflg ? 1 : 0;
						let sendData = { remindflg, companycd, catgcd, typecd, lssuidate, certname, certno, lssuioffice, certterm, reminddays, remarks, grouptype: 3 }

						if (!certname) {
							fn.minAlert('证照名称不能为空');
						} else if (!certno) {
							fn.minAlert('证照编码不能为空');
						} else if (!companycd) {
							fn.minAlert('企业名称不能为空');
						} else {
							if (this.props.certcd) {
								sendData.certcd = this.props.certcd;
								sendData.revision = this.props.revision;
								sendData._state = 'MODIFIED';
							} else {
								sendData._state = 'ADDED';
							}

							// 整理证照范围
							let scopeArr = [];
							let certscope = [];
							for (key in scopeCheckJson) {
								let { cd, displayname, relascd, isChecked, revision } = scopeCheckJson[key];
								let obj = {
									certscopecd: cd,
									scopename: displayname,
									revision,
								};
								if (scopeCheckJson[key].default && !isChecked) {
									obj._state = 'DELETE';
									obj.relascd = relascd;
									scopeArr.push(obj)
								}
								if (!scopeCheckJson[key].default && isChecked) {
									obj._state = 'ADDED';
									scopeArr.push(obj)
								}
								if (isChecked) {
									certscope.unshift(cd);
								}
							}
							sendData.certscope = certscope.toString();
							sendData.MTCSRELAS = JSON.stringify(scopeArr);

							// 整理扩展信息
							let mtcertext = [];
							Object.values(extVals).forEach(val => {
								if (val.text) {
									let { extcd, revision, certextcd } = val.rowData;
									let obj = { extvalue: val.text }
									if (extcd) {
										Object.assign(obj, {
											extcd,
											revision,
											certextcd: certextcd || '',
											_state: certextcd ? 'MODIFIED' : 'ADDED',
										})
									} else {
										obj._state = 'ADDED';
									}
									mtcertext.push(obj);
								}
							})
							sendData.mtcertext = JSON.stringify(mtcertext);

							// 整理图片信息 
							let imageData = [];
							imageJson.forEach((val, i) => {
								let { imageurl, _state, imgcd, certimgcd, revision, imgheight, imgwidth } = val;
								if (_state) {
									let obj = {
										imagetype: 3,
										imageurl, _state, imgwidth, imgheight,
										RESOLUTION: `${imgwidth}*${imgheight}`,
									}
									if (imgcd) {
										obj.certimgcd = certimgcd;
										obj.imgcd = imgcd;
										obj.revision = revision;
									}
									imageData.push(obj);
								}
							})
							sendData.Mtimage = JSON.stringify(imageData);

							console.log(sendData);

							fn.saveData2(sendData, 'PJSON_MTCERT.P_MTCERT_EDIT', `证照-${this.stateText}-移动端`, (bool, res) => {
								if (bool) {
									fn.minAlert(this.stateText + '成功');
									Actions.pop({ refresh: { reload: true } });
								} else {
									console.log(res);
									let msg = fn.parseMessage(res);
									fn.minAlert(`${this.stateText}失败 信息:${msg}`, 5000);
								}
							})

						}

					}}>
						<Text style={{ color: '#fff' }}>{this.stateText}</Text>
					</TouchButton>

				</ScrollView>

				<Modal
					ref="modal1"
					style={globalStyle.container}
					backdropPressToClose={false}
					swipeToClose={false}
					onClosed={this._modal1_closed.bind(this)}
				>
					<View style={globalStyle.listBody}>
						<TextInput style={globalStyle.listInput} placeholder={searchTitle} autoFocus={false} autoCapitalize="none" underlineColorAndroid="transparent"
							onChangeText={(text) => {
								this.setState({ schkeyword: text })
							}}
							onSubmitEditing={() => {
								this._onModalRefresh();
							}}
							value={schkeyword}
						/>
						<Icon name="md-search" size={18} color={globalColor.defaultColor} />
					</View>
					<ListView
						style={globalStyle.container}
						dataSource={this.ds.cloneWithRows(this.state.modalJson)}
						renderRow={this._renderRow.bind(this)}
						enableEmptySections={true}
						initialListSize={10}
						pageSize={5}
						refreshControl={
							<RefreshControl
								refreshing={this.state.isRefreshing_Modal}
								onRefresh={this._onModalRefresh.bind(this)}
								enabled={true}
								colors={[globalColor.refreshControlColor]}
								progressBackgroundColor={globalColor.refreshControlbgc}
								title="正在获取..."
							/>
						}
					/>

				</Modal>

				<Modal
					ref="modalImg"
					style={css.modalImg}
					position={'bottom'}
				>
					<NavBar
						title="选择或拍照"
						bgc={globalColor.modalHeaderbgc}
						titleColor={globalColor.modalHeaderText}
						textColor={globalColor.modalHeaderText}
						height={globalColor.headerHightMain}

						rightMenuIcon="md-close"
						rightMenuColor={globalColor.text3}
						rightMenuClick={() => this.refs.modalImg.close()}
					/>

					<View style={[globalStyle.row, globalStyle.betweenX, { paddingTop: globalColor.headerHightMain, flex: 1 }]}>
						<TouchButton style={css.modalBtn} onPress={() => {
							this.refs.modalImg.close()
							ImagePicker.openPicker({
								width: 800,
								height: 800,
								cropping: true,
								includeBase64: true,
							}).then(this.uploadImage);
						}}>
							<Icon name="md-photos" size={48} color={globalColor.mainColor} />
							<Text style={{ color: globalColor.mainColor }}>从相册选择</Text>
						</TouchButton>
						<TouchButton style={css.modalBtn} onPress={() => {
							ImagePicker.openCamera({
								width: 800,
								height: 800,
								cropping: true,
								includeBase64: true,
							}).then(this.uploadImage);
						}}>
							<Icon name="md-camera" size={48} color={globalColor.mainColor} />
							<Text style={{ color: globalColor.mainColor }}>拍一张新的</Text>
						</TouchButton>
					</View>

				</Modal>
			</View>
		)
	}

	/**
	 * 上传图片
	 * 
	 * @param {any} image 
	 * @memberof Main
	 */
	uploadImage = (image) => {
		this.setState({ isUploading: true });
		const header = 'data:image/jpeg;base64,';
		let sendData = {
			body: {
				imgData: header + image.data,
				imgSn: 'jpeg',
			},
			url: 'com.wx.masterData.uploadcomponent.uploadImg.biz.ext'
		}
		fn.searchData(sendData, (result) => {
			console.log(result);
			let { imagePath, width, height } = JSON.parse(result.img);
			let obj = {
				imageurl: imagePath,
				_state: 'ADDED',
				imgheight: height,
				imgwidth: width,
			}
			let imageJson = Object.assign([], this.state.imageJson);
			imageJson.unshift(obj);
			this.setState({ isUploading: false, imageJson });
		})

	}

	/**
	 * 加载可选择项，如 企业名称/证照类型/..
	 * 
	 * @memberof Main
	 */
	_onModalRefresh() {
		this.setState({ isRefreshing_Modal: true });
		const { displaykey, cdkey, pkg, url, change } = this.keys;
		let sendData = {
			body: {
				"reqMap": { schkeyword: this.state.schkeyword, ...this.keys.sendData },
				// "callEntry": "company_subcompany.searchCertDetail",
				"dbName": "default",
				"namingId": pkg,
			},
			url: url || "com.wx.utils.publicMemer.component.queryNamedSqlMaptoEosMapbiz.biz.ext"
		};

		fn.searchData(sendData, (result) => {
			let modalJson = [];
			result.repMap.forEach(val => {
				modalJson.push({
					displayname: val[displaykey],
					cd: val[cdkey],
					displaykey,
					cdkey,
					change,
					revision: val.revision,
				})
			});
			if (!modalJson.length) {
				modalJson = ['nodata'];
			}
			this.setState({ modalJson, isRefreshing_Modal: false });
		});
	}

	_renderRow(rowData, rowId, rowIndex) {
		let renderView;
		if (typeof rowData == 'object') {
			const { select2 } = this.keys;
			if (select2) {
				const key = `key_${rowData.cd}`;

				let { scopeCheckJson } = this.state;

				let isChecked = scopeCheckJson[key] ? scopeCheckJson[key].isChecked : false;

				renderView = (
					<TouchButton style={globalStyle.listBody} onPress={() => {
						if (scopeCheckJson[key] && scopeCheckJson[key].isChecked) {
							scopeCheckJson[key].isChecked = false;
						} else {
							if (!scopeCheckJson[key]) {
								scopeCheckJson[key] = rowData;
							}
							scopeCheckJson[key].isChecked = true;
						}
						scopeCheckJson[key].revision = rowData.revision;
						this.setState({ scopeCheckJson });
					}}>
						<Awesome name={isChecked ? "check-circle" : "circle-o"} size={18} color={isChecked ? globalColor.green : globalColor.borderColor} style={{ marginRight: 10 }} />
						<Text style={[globalStyle.listText3, { flex: 1 }]}>{rowData.displayname}</Text>
					</TouchButton>
				)
			} else {
				renderView = (
					<View>
						{
							rowIndex == 0 &&
							<TouchButton style={globalStyle.listBody} onPress={() => {
								this.setState({ [rowData.displaykey]: null });
								this.refs.modal1.close();
							}}>
								<Text style={[globalStyle.listText3, { flex: 1 }]}>空</Text>
								<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
							</TouchButton>
						}
						<TouchButton style={globalStyle.listBody} onPress={() => {
							this.setState({ [rowData.displaykey]: rowData.displayname, [rowData.cdkey]: rowData.cd })
							if (rowData.change) {
								this.getExt(rowData);
							}
							this.refs.modal1.close();
						}}>
							<Text style={[globalStyle.listText3, { flex: 1 }]}>{rowData.displayname}</Text>
							<Icon name="ios-arrow-forward" size={18} color={globalColor.defaultColor} />
						</TouchButton>
					</View>
				);
			}
		} else if (rowData === 'loading') {
			return (<Text style={[globalStyle.defaultText, { marginTop: 80 }]}>{globalText.loadingText}</Text>);
		} else if (rowData === 'nodata') {
			return (<Text style={[globalStyle.defaultText, { marginTop: 80 }]}>{globalText.nodataText}</Text>);
		}
		return renderView;
	}

	/**
	 * 获取扩展属性
	 * 
	 * @param {object} rowData 
	 * @memberof Main
	 */
	getExt(rowData) {
		let sendData = {
			body: {
				"reqMap": {
					typecd: rowData.cd,
					certcd: this.props.certcd || '',
				},
				"callEntry": "proof_new.getExtVal",
				"dbName": "default",
				"namingId": "com.wx.masterData.certQueryNamingsql.select_getExtVal"
			},
			url: "com.wx.utils.publicMemer.component.queryNamedSqlMaptoEosMapbiz.biz.ext"
		};
		fn.searchData(sendData, (result) => {
			let extJson = result.repMap;
			if (!extJson.length) {
				extJson = null;
			}
			this.setState({ extJson });
		});
	}

	/**
	 * 打开选择Modal框
	 * 
	 * @param {string} tit = 当前选择标题
	 * @memberof Main
	 */
	searchModal(tit) {
		let { title, rightMenuIcon, leftMenuIcon, } = this.props.navigationState;
		this.refs.modal1.open();
		this.props.navigationState.title = `选择${tit}`;
		this.props.navigationState.back = false;
		this.props.navigationState.rightMenuTitle = '搜索';
		this.props.navigationState.leftMenuIcon = 'md-close';
		this.props.navigationState.leftMenuClick = () => {
			this.refs.modal1.close();
		};
		this.props.navigationState.rightMenuClick = () => {
			this._onModalRefresh();
		}
		this.setState({ searchTitle: `搜索 ${tit}` });
		this._onModalRefresh();
	}

	/**
	 * Modal框关闭动画完成后触发
	 * 
	 * @memberof Main
	 */
	_modal1_closed() {
		this.props.navigationState.rightMenuTitle = null;
		this.props.navigationState.title = '证照发布';
		this.props.navigationState.back = true;
		this.setState({ modalJson: ['loading'], schkeyword: null });
	}

} // Main

let css = {
	imgBox: {
		marginTop: 10,
		padding: 10,
		backgroundColor: '#fff',
		borderTopWidth: .5,
		borderBottomWidth: .5,
		borderColor: globalColor.borderColor,
	},
	imgBtn: {
		width: 88,
		height: 88,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: .5,
		borderColor: globalColor.borderColor,
		borderRadius: 8,
		backgroundColor: '#fafafa',
		marginRight: 5,
	},
	img: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
	},
	imgRemove: {
		position: 'absolute',
		right: 0,
		top: 0,
		paddingTop: 2,
		paddingBottom: 2,
		paddingLeft: 10,
		paddingRight: 10,
		borderRadius: 8,
		borderTopLeftRadius: 0,
		borderBottomRightRadius: 0,
		backgroundColor: globalColor.black45,
	},
	imgRemoveIcon: {
		zIndex: 10,
		color: '#fff',
		fontSize: 24,
	},
	modalImg: {
		height: 200,
	},
	modalBtn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}
}
export default Main;